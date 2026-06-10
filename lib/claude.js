import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompt.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Splits an incoming message into an optional STYLE override and the notes body.
// Convention: if the message contains a line beginning with "STYLE:" (case-insensitive),
// everything on that line after STYLE: is the aesthetic override; the rest is notes.
export function parseMessage(raw) {
  const lines = raw.split(/\r?\n/);
  const styleLines = [];
  const noteLines = [];
  for (const line of lines) {
    const m = line.match(/^\s*STYLE\s*:\s*(.*)$/i);
    if (m) styleLines.push(m[1].trim());
    else noteLines.push(line);
  }
  return {
    style: styleLines.join(" ").trim(),
    notes: noteLines.join("\n").trim(),
  };
}

export async function notesToHtml(notes, style) {
  let userContent = "";
  if (style) {
    userContent += `STYLE INSTRUCTION (override the default aesthetic, never the content rules):\n${style}\n\n`;
  }
  userContent += `STUDY NOTES TO FORMAT:\n\n${notes}`;

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  let html = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Defensive: strip accidental code fences if the model adds them.
  html = html.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();

  if (!html.toLowerCase().startsWith("<!doctype") && !html.toLowerCase().startsWith("<html")) {
    throw new Error("Claude did not return an HTML document.");
  }
  return html;
}
