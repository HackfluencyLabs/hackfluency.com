/**
 * Proxy de contacto — HFLUENCY
 *
 * Recibe el POST del formulario y lo reenvía a Telegram.
 * El token del bot vive como secreto del Worker (env.TELEGRAM_BOT_TOKEN)
 * y NUNCA se envía al navegador.
 *
 * Deploy:
 *   npx wrangler secret put TELEGRAM_BOT_TOKEN
 *   npx wrangler secret put TELEGRAM_CHAT_ID
 *   npx wrangler deploy
 */

const LIMITS = { name: 120, email: 200, message: 4000 };

// Rate limit best-effort por isolate (no persistente). Para algo robusto,
// usar un KV namespace o Durable Object.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function rateLimited(ip) {
  const now = Date.now();
  const times = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  times.push(now);
  hits.set(ip, times);
  if (hits.size > 5000) hits.clear();
  return times.length > MAX_PER_WINDOW;
}

function esc(s) {
  return String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://www.hackfluency.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (rateLimited(ip)) return json({ ok: false, error: 'rate_limited' }, 429, cors);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'invalid_json' }, 400, cors);
    }

    const name = String(body.name ?? '').trim().slice(0, LIMITS.name);
    const email = String(body.email ?? '').trim().slice(0, LIMITS.email);
    const message = String(body.message ?? '').trim().slice(0, LIMITS.message);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'invalid_email' }, 400, cors);
    }
    if (message.length < 5) return json({ ok: false, error: 'short_message' }, 400, cors);

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return json({ ok: false, error: 'not_configured' }, 500, cors);
    }

    const text =
      '<b>Nuevo contacto — HFLUENCY</b>\n' +
      '<b>Nombre:</b> ' + esc(name || '(sin nombre)') + '\n' +
      '<b>Email:</b> ' + esc(email) + '\n' +
      '<b>Mensaje:</b>\n' + esc(message) + '\n' +
      '<b>Fecha:</b> ' + new Date().toISOString();

    const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: Number(env.TELEGRAM_CHAT_ID),
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!tg.ok) return json({ ok: false, error: 'upstream' }, 502, cors);
    return json({ ok: true }, 200, cors);
  },
};
