// Server-only: lead alerts to Ben’s private Telegram chat. Never log their contents.
export function formatLeadAlert(lead) {
  if (lead.type === 'advice') return `[Codex] New advice enquiry — call now\nName: ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email}\n\nSituation:\n${lead.situation}`;
  return lead.marketing
    ? `[Codex] New career-check lead\nEmail: ${lead.email}\nPaths: ${(lead.paths || []).join(', ')}\nReport sent. Follow-up emails allowed. Reply personally while it is fresh.`
    : '[Codex] Career-check report sent. This person opted out of follow-ups; do not contact them.';
}

export function careerReplyDraft(lead) {
  const paths = (lead.paths || []).join(', ');
  return {
    to: lead.email,
    subject: 'Your AI career check — a quick question',
    body: `Hi! It's Ben here.\n\nI hope you found our career checker useful. You looked at ${paths}.\n\nWhat’s the main career decision you or your family are trying to make at the moment?\n\nCheers,\nBen`,
  };
}

export async function sendLeadAlert(lead, {
  token = process.env.TELEGRAM_BOT_TOKEN,
  chatId = process.env.TELEGRAM_CHAT_ID,
  fetchImpl = fetch,
} = {}) {
  if (!token || !chatId) {
    console.error('Lead alert not configured: Telegram credentials missing.');
    return false;
  }
  const text = formatLeadAlert(lead);
  const entities = lead.type === 'advice'
    ? [{ type: 'phone_number', offset: text.indexOf('\nPhone: ') + 8, length: lead.phone.length }]
    : [];
  const phone = lead.type === 'advice' ? lead.phone.replace(/[\s()-]/g, '') : '';
  const reply_markup = /^\+?\d{7,15}$/.test(phone)
    ? { inline_keyboard: [[{ text: 'Call lead', url: `https://www.stablefuture.uk/call-lead.html#${encodeURIComponent(phone)}` }]] }
    : lead.type === 'career-check' && lead.marketing
      ? { inline_keyboard: [[{ text: 'Draft reply', url: `https://www.stablefuture.uk/email-lead.html#${encodeURIComponent(JSON.stringify(careerReplyDraft(lead)))}` }]] }
      : undefined;
  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId.trim(), text, entities, reply_markup, link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(8000),
    });
    const result = await response.json();
    if (response.ok && result.ok === true) return true;
  } catch { /* Do not log provider errors: they can contain the bot token or lead data. */ }
  console.error('Telegram lead alert failed.');
  return false;
}
