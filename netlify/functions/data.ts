import Anthropic from '@anthropic-ai/sdk';
import type { Config } from '@netlify/functions';

const SYSTEM_PROMPT = `You convert a plain-English description of a process or system into a single valid Mermaid diagram.

Rules:
- Output ONLY Mermaid syntax. No prose, no explanation, no Markdown code fences.
- Choose the diagram type that fits best (flowchart, sequenceDiagram, stateDiagram-v2, erDiagram, ...). Default to "flowchart TD" for general flows.
- Label nodes and edges clearly and concisely.
- Keep it strictly renderable — never invent Mermaid syntax that wouldn't parse.`;

const client = new Anthropic();

export default async (req: Request) => {
  if (req.headers.get('origin') !== new URL(req.url).origin) {
    return Response.json({ error: 'Forbidden.' }, { status: 403 });
  }

  try {
    const { prompt } = await req.json();
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2000) {
      return Response.json(
        { error: 'Describe your flow in 1–2000 characters.' },
        { status: 400 },
      );
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    // The model sometimes wraps its answer in code fences despite the prompt.
    const code = text.replace(/^```(?:mermaid)?\s*\n|\n```$/g, '').trim();
    return Response.json({ code });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: 'Could not generate a diagram.' },
      { status: 500 },
    );
  }
};

export const config: Config = {
  path: '/api/data',
  method: 'POST',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
