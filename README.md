# Nova-Ai

A premium purple-glass AI chat app with OpenAI text responses, browser voice input/output, and image generation.

## Requirements
- Node.js 20+
- An OpenAI API key with API billing enabled and access to the selected models

## Run locally
1. Install dependencies: `npm install`
2. Set environment variable `OPENAI_API_KEY` to your secret key.
3. Optional: set `OPENAI_CHAT_MODEL` (default `gpt-4.1-mini`) and `OPENAI_IMAGE_MODEL` (default `gpt-image-2.5-sunburst`).
4. Start: `npm start`
5. Open `http://localhost:3000`

Never commit `.env` or your API key to GitHub. Set secrets in your hosting provider's environment-variable settings.

## Deploy on Render
1. Push this repository to GitHub.
2. In Render, create a new **Web Service** and connect this repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable `OPENAI_API_KEY` with your key. Optionally set `OPENAI_CHAT_MODEL` and `OPENAI_IMAGE_MODEL`.
6. Deploy.

The included `render.yaml` can also be used as a Render Blueprint.

## Notes
- Browser voice input uses the Web Speech API and is most reliable in Chrome; browser/device support varies.
- Voice output uses the browser's built-in speech synthesis.
- Chat and image generation call the OpenAI API from the server. API usage can incur charges.
- The public demo has basic per-IP rate limiting. For a public production app, add user authentication, stronger abuse prevention, and usage limits before sharing widely.
