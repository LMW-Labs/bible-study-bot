const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;

export async function sendMessage(chatId, text) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function sendDocument(chatId, pdfBuffer, filename, caption) {
  // multipart/form-data with the PDF as a file part.
  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (caption) form.append("caption", caption);
  const blob = new Blob([pdfBuffer], { type: "application/pdf" });
  form.append("document", blob, filename);

  const res = await fetch(`${API}/sendDocument`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram sendDocument failed: ${res.status} ${body}`);
  }
}
