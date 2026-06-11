import Anthropic from '@anthropic-ai/sdk';

// We call Anthropic straight from the browser. `dangerouslyAllowBrowser` is the
// SDK's required opt-in for that — it's blocked by default because the API key is
// exposed to the client. That's an accepted tradeoff for this front-end-only demo;
// a production build would move this behind a thin backend proxy and drop the flag.
let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (client) return client;

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing VITE_ANTHROPIC_API_KEY — copy .env.example to .env.local and add your key.',
    );
  }

  client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  return client;
}
