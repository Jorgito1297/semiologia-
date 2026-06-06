// ============================================================================
// SUPABASE EDGE FUNCTION: Proxy Seguro de Moodle con CORS y Descifrado de Token
// Entorno: Deno / TypeScript
// Idioma: Español
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// Orígenes permitidos para CORS (solo dominios de Firebase Hosting y Next.js dev server)
const ALLOWED_ORIGINS = [
  "https://study-with-me-med.web.app",
  "https://study-with-me-med.firebaseapp.com",
  "http://localhost:3000",   // Next.js dev server
  "http://127.0.0.1:3000",  // Next.js dev server
  "http://localhost:8080",   // Para pruebas locales
  "http://127.0.0.1:8080",  // Para pruebas locales
];

// Función para obtener cabeceras CORS dinámicas según el origen de la petición
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// Interfaz para la solicitud de Login
interface LoginRequestBody {
  action: "login";
  moodleUrl: string;
  username: string;
  password: string;
}

// Interfaz para la solicitud de Sincronización de Datos (reservada para futuras expansiones)
// interface FetchRequestBody {
//   action: "fetch_data";
// }

// Función auxiliar para convertir cadenas Hexadecimales a Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let c = 0; c < hex.length; c += 2) {
    bytes[c / 2] = parseInt(hex.substring(c, c + 2), 16);
  }
  return bytes;
}

// Función auxiliar para convertir Uint8Array a cadenas Hexadecimales
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Obtener la clave criptográfica de las variables de entorno de Supabase
async function getCryptoKey(secretKey: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(secretKey.padEnd(32, "0").substring(0, 32)); // Forzar a 256 bits (32 bytes)
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encriptar el token de Moodle (AES-256-GCM)
async function encryptToken(token: string, secretKey: string): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const key = await getCryptoKey(secretKey);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // IV recomendado de 12 bytes para GCM
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    enc.encode(token)
  );

  return {
    ciphertext: bytesToHex(new Uint8Array(encryptedBuffer)),
    iv: bytesToHex(iv),
  };
}

// Desencriptar el token de Moodle (AES-256-GCM)
async function decryptToken(ciphertextHex: string, ivHex: string, secretKey: string): Promise<string> {
  const dec = new TextDecoder();
  const key = await getCryptoKey(secretKey);
  const iv = hexToBytes(ivHex);
  const encryptedBytes = hexToBytes(ciphertextHex);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedBytes
  );

  return dec.decode(decryptedBuffer);
}

// Manejador del servidor HTTP de Deno
Deno.serve(async (req) => {
  const CORS_HEADERS = getCorsHeaders(req);

  // Manejo de peticiones de pre-vuelo CORS (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // 1. Obtener la sesión de autenticación del usuario (Bearer Token de Teams/Supabase Auth)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Cabecera de autorización no encontrada" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // 2. Inicializar cliente Supabase interno con privilegios de usuario
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validar el token del usuario y obtener su perfil
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuario no autenticado o token inválido", details: userError }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // SEGURIDAD: La clave de cifrado DEBE estar configurada en Supabase → Edge Functions → Secrets
    const secretKey = Deno.env.get("MOODLE_ENCRYPTION_KEY");
    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: "Configuración incompleta: MOODLE_ENCRYPTION_KEY no está definida en los Secrets de Supabase Edge Functions." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 3. Procesar el cuerpo de la solicitud JSON
    const body = await req.json();
    const action = body.action;

    // ==========================================
    // ACCIÓN 1: LOGIN Y OBTENCIÓN DE TOKEN DE MOODLE
    // ==========================================
    if (action === "login") {
      const { moodleUrl, username, password } = body as LoginRequestBody;

      // Sanitizar la URL del servidor Moodle
      const sanitizedUrl = moodleUrl.replace(/\/$/, ""); // Quitar barra diagonal final si existe
      const tokenEndpoint = `${sanitizedUrl}/login/token.php`;

      // Llamada directa sin CORS al script de Moodle
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);
      params.append("service", "moodle_mobile_app");

      const moodleRes = await fetch(tokenEndpoint, {
        method: "POST",
        body: params,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const moodleData = await moodleRes.json();

      if (moodleData.error) {
        return new Response(
          JSON.stringify({ error: "Autenticación fallida en Moodle", details: moodleData.error }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const moodleToken = moodleData.token;
      
      // Obtener el ID de usuario de Moodle haciendo una petición básica
      const siteInfoUrl = `${sanitizedUrl}/webservice/rest/server.php?wstoken=${moodleToken}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`;
      const siteInfoRes = await fetch(siteInfoUrl);
      const siteInfoData = await siteInfoRes.json();
      const moodleUserId = siteInfoData.userid;

      if (!moodleUserId) {
        return new Response(
          JSON.stringify({ error: "No se pudo recuperar la información del usuario en Moodle" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // Encriptar el token recibido antes de guardarlo en Supabase
      const { ciphertext, iv } = await encryptToken(moodleToken, secretKey);

      // Guardar token cifrado en la base de datos (sin updated_at — columna no existe en schema)
      const { error: dbError } = await supabaseClient
        .from("user_tokens")
        .upsert({
          user_id: user.id,
          moodle_url: sanitizedUrl,
          encrypted_token: ciphertext,
          encryption_iv: iv,
          moodle_user_id: moodleUserId,
        });

      if (dbError) {
        return new Response(
          JSON.stringify({ error: "Error guardando el token de Moodle en la BD", details: dbError }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Conexión con Moodle establecida y guardada exitosamente" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // ACCIÓN 2: OBTENCIÓN Y FILTRADO DE DATOS (PROXY)
    // ==========================================
    if (action === "fetch_data") {
      // Descargar las credenciales de Moodle del usuario de la BD
      const { data: credentials, error: credError } = await supabaseClient
        .from("user_tokens")
        .select("moodle_url, encrypted_token, encryption_iv, moodle_user_id")
        .single();

      if (credError || !credentials) {
        return new Response(
          JSON.stringify({ error: "Credenciales de Moodle no encontradas. Inicie sesión primero." }),
          { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      // Descifrar el token de Moodle
      const decryptedToken = await decryptToken(
        credentials.encrypted_token,
        credentials.encryption_iv,
        secretKey
      );

      const moodleHost = credentials.moodle_url;
      const moodleWsUrl = `${moodleHost}/webservice/rest/server.php`;

      // 1. Obtener Eventos de Calendario (Exámenes)
      const nowTimestamp = Math.floor(Date.now() / 1000);
      const calendarParams = new URLSearchParams({
        wstoken: decryptedToken,
        wsfunction: "core_calendar_get_action_events_by_timesort",
        moodlewsrestformat: "json",
        timesortfrom: nowTimestamp.toString(),
      });

      const calendarRes = await fetch(`${moodleWsUrl}?${calendarParams.toString()}`);
      const calendarData = await calendarRes.json();

      // 2. Obtener Asignaciones (Tareas)
      const assignParams = new URLSearchParams({
        wstoken: decryptedToken,
        wsfunction: "mod_assign_get_assignments",
        moodlewsrestformat: "json",
      });

      const assignRes = await fetch(`${moodleWsUrl}?${assignParams.toString()}`);
      const assignData = await assignRes.json();

      // Devolver los datos unificados
      return new Response(
        JSON.stringify({
          calendar: calendarData.events ?? [],
          assignments: assignData.courses ?? [],
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Acción no soportada
    return new Response(
      JSON.stringify({ error: "Acción no soportada" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error interno del servidor", details: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
