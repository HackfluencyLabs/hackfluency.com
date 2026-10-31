# Worker de contacto

Proxy mínimo entre el formulario de `hackfluency.com` y Telegram.

El navegador ya no habla con `api.telegram.org` ni recibe el token: manda
`{ name, email, message }` a este Worker, y el Worker firma la llamada a
Telegram con el secreto guardado en Cloudflare.

## Estado actual

| | |
|---|---|
| Nombre | `hackfluency-contact` |
| Endpoint público | `https://www.hackfluency.com/api/contact` |
| Ruta | `www.hackfluency.com/api/*` (zona `hackfluency.com`) |
| `workers.dev` | deshabilitado — solo se publica en el dominio propio |

## Deploy

```bash
cd worker
npx wrangler login            # una vez
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler deploy
```

## Conectar el sitio

La variable de repositorio `PUBLIC_CONTACT_ENDPOINT` ya apunta al Worker:

```bash
gh variable set PUBLIC_CONTACT_ENDPOINT --body "https://www.hackfluency.com/api/contact"
```

El workflow la inyecta en el build. Sin esa variable, el formulario cae en un
`mailto:` a `inquiry@hackfluency.com` — no se rompe, pero abre el cliente de
correo.

## Verificar

```bash
python smoke_worker.py https://www.hackfluency.com/api/contact
```

Espera 204 en preflight, 405 en GET, 400 en payloads inválidos y 200 en un
envío válido.

## Contrato

```
POST /   Content-Type: application/json
{ "name": "...", "email": "...", "message": "..." }

200 { "ok": true }
400 { "ok": false, "error": "invalid_email" | "short_message" | "invalid_json" }
429 { "ok": false, "error": "rate_limited" }
502 { "ok": false, "error": "upstream" }
```

## Límites

Validación de email, largo máximo de campos y un rate limit de 5 envíos por
minuto por IP. El rate limit es en memoria del isolate (best effort): si hace
falta algo serio, se cambia por un KV namespace o un Durable Object.
