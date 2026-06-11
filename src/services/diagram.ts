import { getAnthropicClient } from './anthropic';
import { MAX_TOKENS, MODEL } from '../constants';

const SYSTEM_PROMPT = `You convert a plain-English description of a process or system into a single valid Mermaid diagram.

Rules:
- Output ONLY Mermaid syntax. No prose, no explanation, no Markdown code fences.
- Choose the diagram type that fits best (flowchart, sequenceDiagram, stateDiagram-v2, erDiagram, ...). Default to "flowchart TD" for general flows.
- Label nodes and edges clearly and concisely.
- Keep it strictly renderable — never invent Mermaid syntax that wouldn't parse.`;

// Some responses still wrap the diagram in ```mermaid fences despite the prompt.
// Strip them defensively so the renderer always receives raw syntax.
function stripCodeFences(text: string): string {
  const fenced = text.match(/^```(?:mermaid)?\s*\n([\s\S]*?)\n```$/);
  return (fenced ? fenced[1] : text).trim();
}

export async function generateMermaid(
  prompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const message = await getAnthropicClient().messages.create(
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    },
    { signal },
  );

  // Join the text blocks. With this prompt the reply is a single block, but joining
  // stays correct if the model ever splits its answer across blocks.
  const code = message.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();

  if (!code) throw new Error('The model returned an empty diagram.');
  return stripCodeFences(code);
}
