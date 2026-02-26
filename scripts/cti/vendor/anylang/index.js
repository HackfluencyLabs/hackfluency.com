const DEFAULT_ENDPOINTS = [
  process.env.ANYLANG_API_URL,
  process.env.LIBRETRANSLATE_URL,
  'https://translate.argosopentech.com/translate',
  'https://libretranslate.de/translate',
  'https://translate.astian.org/translate'
].filter(Boolean);

const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.ANYLANG_HTTP_TIMEOUT_MS || '12000', 10);

function extractText(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.translatedText === 'string' && payload.translatedText.trim()) return payload.translatedText.trim();
  if (typeof payload.translation === 'string' && payload.translation.trim()) return payload.translation.trim();
  if (typeof payload.text === 'string' && payload.text.trim()) return payload.text.trim();
  return null;
}

async function postTranslate(endpoint, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const text = extractText(payload);
    if (!text) {
      throw new Error('No translated text in payload');
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export async function translate(text, fromOrOptions = 'en', maybeTo = 'es') {
  const options = typeof fromOrOptions === 'object' && fromOrOptions !== null
    ? { from: fromOrOptions.from || 'en', to: fromOrOptions.to || 'es' }
    : { from: fromOrOptions || 'en', to: maybeTo || 'es' };

  const body = {
    q: text,
    source: options.from,
    target: options.to,
    format: 'text',
  };

  let lastError = null;
  for (const endpoint of DEFAULT_ENDPOINTS) {
    try {
      const translated = await postTranslate(endpoint, body);
      return { translatedText: translated, provider: endpoint };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No translation endpoints available');
}

export default {
  translate,
};
