const BOT_TOKEN = typeof import.meta !== 'undefined' ? import.meta.env.PUBLIC_TELEGRAM_BOT_TOKEN : '';
const CHAT_ID = typeof import.meta !== 'undefined' ? import.meta.env.PUBLIC_TELEGRAM_CHAT_ID : '';

function escapeMd(text: string): string {
  return text.replace(/[\\_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

export async function sendTelegram(type: 'subscribe' | 'problem', data: Record<string, any>): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) return false;

  let text = '';
  if (type === 'subscribe') {
    text = '📬 *Nueva suscripción*\n*Email:* `' + escapeMd(data.email || '') + '`\n*Fuente:* ' + escapeMd(data.source || 'directa') + '\n*Fecha:* ' + new Date().toISOString();
  } else {
    const areaLabels: Record<string, string> = { security: 'Seguridad', architecture: 'Arquitectura', behavior: 'Comportamiento organizacional', intelligence: 'Inteligencia estratégica', other: 'Otro' };
    const contactLabels: Record<string, string> = { email: 'Email', meeting: 'Reunión breve', depends: 'Depende' };
    text = '🔬 *Nuevo problema recibido*\n*Nombre:* ' + escapeMd(data.name || '(sin nombre)') + '\n*Email:* `' + escapeMd(data.email || '') + '`\n*Área:* ' + escapeMd(areaLabels[data.area] || data.area || '') + '\n*Contacto:* ' + escapeMd(contactLabels[data.contact] || data.contact || '') + '\n*Descripción:*\n```\n' + escapeMd(data.description || '') + '\n```\n*Fecha:* ' + new Date().toISOString();
  }

  try {
    const res = await fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(CHAT_ID), text, parse_mode: 'MarkdownV2' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
