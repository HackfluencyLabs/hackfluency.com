const PRIMARY_ENDPOINT = process.env.ANYLANG_API_URL || process.env.LIBRETRANSLATE_URL || 'http://127.0.0.1:5000/translate';
const EXTRA_ENDPOINTS = (process.env.TRANSLATION_FALLBACK_URLS || '')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);
const TIMEOUT_MS = parseInt(process.env.ANYLANG_HTTP_TIMEOUT_MS || process.env.TRANSLATION_HTTP_TIMEOUT_MS || '12000', 10);

function uniqueEndpoints(): string[] {
  return [...new Set([
    PRIMARY_ENDPOINT,
    ...EXTRA_ENDPOINTS,
  ])];
}

function extractTranslatedText(payload: any): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const val = payload.translatedText || payload.translation || payload.text || payload.result;
  return typeof val === 'string' && val.trim() ? val.trim() : null;
}

async function postTranslate(endpoint: string, body: any): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const translated = extractTranslatedText(data);
    if (!translated) throw new Error('No translated text in response payload');

    return translated;
  } finally {
    clearTimeout(timeout);
  }
}

export async function translate(text: string, fromOrOptions: string | { from?: string; to?: string } = 'en', maybeTo = 'es') {
  const opts = typeof fromOrOptions === 'object' && fromOrOptions !== null
    ? { from: fromOrOptions.from || 'en', to: fromOrOptions.to || 'es' }
    : { from: fromOrOptions || 'en', to: maybeTo || 'es' };

  const body = { q: text, source: opts.from, target: opts.to, format: 'text' };

  let lastError: unknown = null;
  for (const endpoint of uniqueEndpoints()) {
    try {
      const translatedText = await postTranslate(endpoint, body);
      return { translatedText, provider: endpoint };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No translation endpoints available');
}

export default { translate };
