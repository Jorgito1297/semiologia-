This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Integracion de Ollama con Antigravity

Si Antigravity permite proveedor OpenAI compatible personalizado, puedes usar Ollama local como motor LLM.

Configuracion recomendada:

- Base URL: http://localhost:11434/v1
- API Key: ollama (o cualquier texto si el cliente la exige)
- Modelo: llama3.1:8b (o el que tengas en Ollama)

Comandos utiles:

- ollama pull llama3.1:8b
- ollama serve
- ollama list

Nota de costos y continuidad:

- Si Antigravity solo actua como UI y deja pasar requests a tu endpoint local, Ollama puede seguir funcionando aunque se acaben fondos del proveedor cloud.
- Si Antigravity enruta todo por su backend cerrado o exige creditos propios para cualquier request, no funcionara sin fondos aunque Ollama este encendido.

Prueba rapida:

1. Inicia Ollama y verifica el modelo con ollama list.
2. Configura Antigravity al endpoint local en /v1.
3. Envia un prompt corto.
4. Si responde sin consumir proveedor externo, quedo operando en modo local.

### Ollama en Docker (recomendado cuando localhost falla)

Se incluye compose en [docker-compose.ollama.yml](docker-compose.ollama.yml).

Comandos:

- docker compose -f docker-compose.ollama.yml up -d
- docker exec -it semiologia-ollama ollama pull llama3.1:8b
- docker logs -f semiologia-ollama

Endpoints segun despliegue de Antigravity:

- Antigravity en tu host (Windows/macOS/Linux): http://localhost:11434/v1
- Antigravity dentro de Docker: http://host.docker.internal:11434/v1

### Configuracion local sin creditos (recomendada para este repo)

Este repositorio quedo preparado para usar Ollama local por defecto.

1. Crea tu archivo de entorno a partir de [.env.example](.env.example).
2. Levanta Ollama:

```bash
docker compose -f docker-compose.ollama.yml up -d
docker exec -it semiologia-ollama ollama pull qwen3:8b
docker exec -it semiologia-ollama ollama pull nomic-embed-text
```

3. Verifica Ollama:

```bash
curl http://localhost:11434/api/tags
```

4. Ejecuta el simulador virtual:

```bash
python src/ai/virtual_patient.py
```

Variables clave:

- `LLM_PROVIDER=ollama`
- `OLLAMA_BASE_URL=http://localhost:11434`
- `OLLAMA_CHAT_MODEL=qwen3:8b` (fallback recomendado: `qwen2.5:7b-instruct`)
- `OLLAMA_EMBED_MODEL=nomic-embed-text`
- `EMBEDDING_PROVIDER=ollama`

Para evitar consumo externo, deja vacias estas variables:

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
