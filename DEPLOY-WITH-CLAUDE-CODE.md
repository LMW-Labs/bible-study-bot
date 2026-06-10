# Deploy with Claude Code

This checklist is meant to be handed to **Claude Code**. It marks which steps Claude Code
can run in the terminal (🤖) and which need **you** to do something outside the machine (👤,
usually grabbing a credential or clicking a browser approval).

The order below is the clean "Git import" path: push to GitHub → import in Vercel →
add env vars → deploy. It works on the first real deploy.

---

## Before you start — gather these (👤)
- [ ] 👤 **Anthropic API key** — https://console.anthropic.com → API Keys
- [ ] 👤 **Telegram bot token** — in Telegram, message @BotFather → `/newbot` → copy the token
- [ ] 👤 **Webhook secret** — invent any random string (e.g. a password-manager string)

Keep these somewhere handy. Do NOT paste them into any file in this project.

---

## 1. Push to GitHub
- [ ] 🤖 Run the helper from the project folder:
      ```
      chmod +x push-to-github.sh
      ./push-to-github.sh <your-github-username> bible-study-bot private
      ```
- [ ] 👤 If prompted, authenticate GitHub (`gh auth login` opens a browser, or paste a token).

## 2. Import the repo into Vercel
- [ ] 👤 Go to vercel.com → **Add New… → Project → Import** the `bible-study-bot` repo.
      (Or 🤖 `vercel link` / `vercel` from the folder if you prefer the CLI — you'll still
      approve login in a browser.)

## 3. Add environment variables (👤 types the secret values)
In Vercel → Project → **Settings → Environment Variables**, add:
- [ ] `ANTHROPIC_API_KEY`
- [ ] `TELEGRAM_BOT_TOKEN`
- [ ] `TELEGRAM_WEBHOOK_SECRET`
- [ ] `ALLOWED_CHAT_IDS`  → leave EMPTY for now (filled in step 6)

(Or 🤖 `vercel env add ANTHROPIC_API_KEY production` etc. — Claude Code runs the command,
you type the value at the prompt.)

## 4. Deploy
- [ ] 🤖 `vercel --prod`
- [ ] Note the production URL it prints. Your webhook is that URL + `/api/telegram`.

## 5. Register the Telegram webhook
- [ ] 🤖 Run (fill in token, URL, secret):
      ```
      curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
        -d "url=https://YOUR-PROJECT.vercel.app/api/telegram" \
        -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
      ```
- [ ] Expect `{"ok":true,...}`.

## 6. Lock down with chat IDs
- [ ] 👤 Have your friend (and you) message the bot anything.
- [ ] 🤖 `curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates"`
- [ ] 👤 Read the `"chat":{"id":...}` numbers.
- [ ] 👤 Put them comma-separated into `ALLOWED_CHAT_IDS` in Vercel env vars.
- [ ] 🤖 `vercel --prod` to redeploy with the allowlist active.

## 7. Test
- [ ] 👤 Send the bot some study notes. PDF should come back in ~20–40s.
- [ ] 👤 Try a `STYLE:` line to confirm the aesthetic override works.

---

### If something breaks
- 🤖 Check logs: `vercel logs <deployment-url>` or the Vercel dashboard → Deployments → Logs.
- Common causes: an env var missing/typo'd, the webhook secret not matching, or chromium
  needing a version bump (`@sparticuz/chromium` in package.json). See README.md notes.
