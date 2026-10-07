// Server-only: lead alerts to Ben’s private Telegram chat. Never log their contents.
export function formatLeadAlert(lead) {
  if (lead.type === 'booking') return `BOOKING\n\nName: ${lead.name}\nEmail: ${lead.email}\nCall: ${lead.title}\nWhen: ${lead.when} (UK time)${lead.meetUrl ? `\nGoogle Meet: ${lead.meetUrl}` : ''}\n\nSituation:\n${lead.situation || 'Not provided'}`;
  return lead.marketing
    ? `CHECKER\n\nEmail: ${lead.email}\nPaths: ${(lead.paths || []).join(', ')}`
    : 'CHECKER\n\nFollow-up: Opted out';
}

export function careerReplyDraft(lead) {
  const paths = (lead.paths || []).join(', ');
  return {
    to: lead.email,
    subject: 'Quick question about your AI career check',
    body: `Hi! It's Ben here.\n\nI hope you found our career checker useful. You looked at ${paths}.\n\nWhat’s the main career decision you or your family are trying to make at the moment?\n\nIf you’d rather not hear from me, just reply and say so.\n\nCheers,\nBen`,
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
  const entities = [{ type: 'bold', offset: 0, length: 7 }];
  const reply_markup = lead.type === 'career-check' && lead.marketing
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
