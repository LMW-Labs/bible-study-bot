# Bible Study → PDF Telegram Bot

Your friend messages a Telegram bot with their study notes. The bot sends back a
formatted PDF (the "Modern Study Guide" template). An optional `STYLE:` line in the
message overrides the look. Runs on Vercel; formatting is done by Claude on **your**
Anthropic key (cost is a few cents per PDF).

---

## What you need before deploying
1. An **Anthropic API key** — https://console.anthropic.com → API Keys.
2. A **Telegram bot token** — see step 1 below.
3. A **webhook secret** — any random string you invent (e.g. a password-manager string).
4. Your friend's (and your) **Telegram chat ID** — see step 5.

---

## Step 1 — Create the bot (2 minutes)
1. In Telegram, message **@BotFather**.
2. Send `/newbot`. Give it a name and a username ending in `bot`.
3. BotFather replies with a **token** like `123456:ABC-DEF...`. Save it. That's `TELEGRAM_BOT_TOKEN`.

## Step 2 — Deploy to Vercel
From this folder:
```
npm i -g vercel        # if you don't have it
vercel                 # link/create the project, accept defaults
vercel --prod          # deploy to production; note the URL it prints
```
Your webhook URL will be: `https://YOUR-PROJECT.vercel.app/api/telegram`

## Step 3 — Set environment variables
In the Vercel dashboard → your project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | your Anthropic key |
| `TELEGRAM_BOT_TOKEN` | from BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | your random secret string |
| `ALLOWED_CHAT_IDS` | your friend's chat ID (and yours), comma-separated — see step 5 |

After adding them, redeploy: `vercel --prod`.

## Step 4 — Register the webhook with Telegram
Run once (fill in your token, URL, and secret):
```
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://YOUR-PROJECT.vercel.app/api/telegram" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```
You should get `{"ok":true,...}`.

## Step 5 — Find chat IDs (for the allowlist)
1. Temporarily leave `ALLOWED_CHAT_IDS` empty and redeploy (this lets anyone through briefly).
2. Have your friend message the bot anything.
3. Visit: `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates`
4. Find `"chat":{"id": ...}` — that number is the chat ID.
5. Put the IDs (comma-separated) into `ALLOWED_CHAT_IDS`, redeploy. Now only those chats work.

---

## How your friend uses it
- Open the bot in Telegram, paste the study notes, send. PDF comes back in ~20–40s.
- To change the look, start a line with `STYLE:` e.g.
  ```
  STYLE: warm devotional, parchment background, large serif headings
  <the notes below>
  ```
- No `STYLE:` line = the default Modern Study Guide template.

## Cost control (you're the payer)
- `ALLOWED_CHAT_IDS` blocks everyone except listed chats.
- `MAX_INPUT_CHARS` in `api/telegram.js` caps request size (default 20,000 chars ≈ 5k tokens).
- Each PDF is roughly 2–5¢ on Claude at typical study length.

## Notes / gotchas
- The function is configured for 1024MB memory and 60s max duration (`vercel.json`) —
  needed because headless Chrome + the Claude call can take 20–40s.
- Uses `@sparticuz/chromium` + `puppeteer-core` (the only combo that fits Vercel's
  serverless size limits). Versions are pinned in `package.json`; if a future Vercel
  Node runtime breaks chromium, bump `@sparticuz/chromium` to match.
- The content rules (only spelling/punctuation fixes, organizing titles allowed, no
  meaning changes, keep duplicate-verse wordings, drop verbatim duplicates) live in
  `lib/prompt.js`. Edit there to adjust behavior.
