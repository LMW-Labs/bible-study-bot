import { parseMessage, notesToHtml } from "../lib/claude.js";
import { htmlToPdf } from "../lib/pdf.js";
import { sendMessage, sendDocument } from "../lib/telegram.js";

// --- Cost / abuse guards ---
// Comma-separated Telegram chat IDs allowed to use the bot (you + your friend).
const ALLOWED = (process.env.ALLOWED_CHAT_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const MAX_INPUT_CHARS = 20000; // ~5k tokens; caps per-request cost.

function deriveFilename(html) {
  const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const base = (m ? m[1] : "Bible-Study").replace(/[^\w\d]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "Bible-Study"}.pdf`;
}

export default async function handler(req, res) {
  // 1. Only accept POST.
  if (req.method !== "POST") {
    return res.status(200).send("ok");
  }

  // 2. Verify Telegram's secret header so randoms can't hit the endpoint.
  const secret = req.headers["x-telegram-bot-api-secret-token"];
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).send("unauthorized");
  }

  const update = req.body;
  const msg = update?.message;
  const chatId = msg?.chat?.id;
  const text = msg?.text;

  // Always 200 quickly on non-text updates so Telegram doesn't retry.
  if (!chatId || !text) {
    return res.status(200).send("ok");
  }

  // 3. Allowlist guard (you're paying — only let approved chats trigger it).
  if (ALLOWED.length && !ALLOWED.includes(String(chatId))) {
    await sendMessage(chatId, "This bot is private.");
    return res.status(200).send("ok");
  }

  // Simple help / start handling.
  if (text.trim() === "/start" || text.trim() === "/help") {
    await sendMessage(
      chatId,
      "Send me your Bible study notes and I'll turn them into a formatted PDF.\n\n" +
        "Optional: start a line with `STYLE:` to change the look, e.g.\n" +
        "STYLE: warm devotional, parchment background, serif\n\n" +
        "Everything else in the message is treated as the notes."
    );
    return res.status(200).send("ok");
  }

  // 4. Input-size guard.
  if (text.length > MAX_INPUT_CHARS) {
    await sendMessage(
      chatId,
      `That's a bit long (${text.length} chars). Please keep notes under ${MAX_INPUT_CHARS} characters, or split into two messages.`
    );
    return res.status(200).send("ok");
  }

  // 5. Acknowledge immediately (the heavy work follows in the same invocation).
  await sendMessage(chatId, "Got it — formatting your notes into a PDF. This takes 20–40 seconds…");

  try {
    const { style, notes } = parseMessage(text);
    if (!notes) {
      await sendMessage(chatId, "I didn't find any notes in that message. Send the study text and I'll format it.");
      return res.status(200).send("ok");
    }

    const html = await notesToHtml(notes, style);
    const pdf = await htmlToPdf(html);
    const filename = deriveFilename(html);

    await sendDocument(chatId, pdf, filename, "Here's your formatted study 📖");
  } catch (err) {
    console.error(err);
    await sendMessage(chatId, "Something went wrong while building the PDF. Please try again, or send the notes in a smaller chunk.");
  }

  return res.status(200).send("ok");
}
