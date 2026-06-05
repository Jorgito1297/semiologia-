
        // Supabase Client initialization helper
        const getSupabaseConfig = () => {
            const url = window.SUPABASE_URL || localStorage.getItem('SUPABASE_URL');
            const key = window.SUPABASE_ANON_KEY || localStorage.getItem('SUPABASE_ANON_KEY');
            return (url && key) ? { url, key } : null;
        };

        const config = getSupabaseConfig();
        let supabase = null;
        if (config) {
            try {
                supabase = window.supabase.createClient(config.url, config.key);
                console.log("Supabase inicializado correctamente.");
            } catch (e) {
                console.error("Error al inicializar Supabase client:", e);
            }
        }

        // Toggle password visibility
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eyeIcon');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.innerText = 'OCULTAR';
            } else {
                passwordInput.type = 'password';
                eyeIcon.innerText = 'MOSTRAR';
            }
        }

        function showLoader() {
            const loaderOverlay = document.getElementById('loaderOverlay');
            const loginCardContainer = document.getElementById('loginCardContainer');

            // Ocultar tarjeta principal y mostrar overlay
            loginCardContainer.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                loaderOverlay.classList.remove('hidden');
                setTimeout(() => {
                    loaderOverlay.classList.remove('opacity-0');
                    loaderOverlay.classList.add('opacity-100');
                }, 50);
            }, 300);
        }

        function updateLoader(percent, title, subtext) {
            document.getElementById('loaderTitle').innerText = title;
            document.getElementById('loaderSubtext').innerText = subtext;
            document.getElementById('loaderBar').style.width = percent + "%";
        }

        // Handle login submission
        async function handleLogin(event) {
            event.preventDefault();

            const university = document.getElementById('university').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            showLoader();

            // Soportar doble modo
            if (supabase) {
                try {
                    updateLoader(20, "Autenticando usuario en Supabase...", "Seguridad SSL Activa");
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    
                    if (error) throw error;

                    updateLoader(50, "Invocando proxy Edge de Moodle...", "Sincronizando Aula");
                    
                    // Mapear universidad a URL de Moodle
                    const moodleUrls = {
                        UCE: "https://moodle.uce.edu.do",
                        UASD: "https://uasdvirtual.edu.do",
                        INTEC: "https://virtual.intec.edu.do",
                        UNIBE: "https://unibevirtual.edu.do",
                        PUCMM: "https://pucmmvirtual.edu.do"
                    };
                    const moodleUrl = moodleUrls[university] || "https://moodle.uce.edu.do";

                    const response = await fetch(`${config.url}/functions/v1/supabase_moodle_proxy`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${data.session.access_token}`
                        },
                        body: JSON.stringify({
                            action: 'login',
                            moodleUrl: moodleUrl,
                            username: email.split('@')[0],
                            password: password
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.error || "Fallo en la comunicación con el Edge Function Proxy");
                    }

                    updateLoader(80, "Sincronizando base de datos...", "Alineando Syllabus");

                    // Almacenar credenciales del estudiante en sesión de producción
                    localStorage.setItem('study_university', university);
                    localStorage.setItem('study_email', email);
                    localStorage.setItem('study_user', email.split('@')[0]);
                    localStorage.setItem('is_demo', 'false');

                    updateLoader(100, "¡Acceso concedido exitosamente!", "Cargando Aula Virtual");
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);

                } catch (err) {
                    console.warn("Fallo de autenticación en Supabase, entrando en Modo Demo. Detalles:", err);
                    runDemoMode(university, email);
                }
            } else {
                // Modo Demo directo
                runDemoMode(university, email);
            }
        }

        // Ejecutar animación de Modo Demo por 3 segundos
        function runDemoMode(university, email) {
            updateLoader(15, "Estableciendo entorno local demo...", "Simulación Comercial");
            
            const quotes = [
                "\"El dolor de la pericarditis aguda típicamente se alivia al inclinarse hacia adelante.\"",
                "\"La auscultación del R3 es fisiológica en jóvenes, pero sugiere insuficiencia cardíaca en adultos.\"",
                "\"El pulso dicroto es un signo clásico de la fiebre tifoidea y de baja resistencia periférica.\"",
                "\"La semiología es el arte del diagnóstico clínico rápido mediante la agudeza sensorial.\"",
                "\"El signo de Murphy es positivo si se interrumpe la inspiración al presionar el hipocondrio derecho.\"",
                "\"La triada de Charcot (fiebre, ictericia y dolor abdominal) es indicativa de colangitis aguda.\"",
                "\"El signo de Babinski es patológico en adultos y sugiere lesión de la vía piramidal.\""
            ];

            const phases = [
                { percent: 45, title: "Generando simulación clínica de alta fidelidad...", subtext: "Cargando 7 Cursos" },
                { percent: 80, title: "Configurando base de datos local temporal...", subtext: "Inicializando Progreso" },
                { percent: 100, title: "¡Entorno Demo listo!", subtext: "Redireccionando..." }
            ];

            // Seleccionar perla clínica aleatoria
            document.getElementById('loaderQuote').innerText = quotes[Math.floor(Math.random() * quotes.length)];

            // Guardar datos de simulación
            localStorage.setItem('study_university', university);
            localStorage.setItem('study_email', email);
            localStorage.setItem('study_user', email.split('@')[0]);
            localStorage.setItem('is_demo', 'true');

            let phaseIdx = 0;
            const timer = setInterval(() => {
                if (phaseIdx < phases.length) {
                    const currentPhase = phases[phaseIdx];
                    updateLoader(currentPhase.percent, currentPhase.title, currentPhase.subtext);
                    if (phaseIdx === 1) {
                        // Cambiar la perla clínica a mitad de camino
                        document.getElementById('loaderQuote').innerText = quotes[Math.floor(Math.random() * quotes.length)];
                    }
                    phaseIdx++;
                } else {
                    clearInterval(timer);
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                }
            }, 900); // Sincroniza fases para sumar 2.7s + 0.3s transiciones = ~3.0 segundos
        }
    