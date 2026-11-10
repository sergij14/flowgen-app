// The /api/data contract, kept free of SDK and runtime imports so it can be
// unit-tested without an API key or a Netlify runtime.

export const MAX_PROMPT_CHARS = 2000;
// The model's output is capped at 1500 tokens (~6000 characters), so a real
// diagram fits comfortably under this.
export const MAX_CODE_CHARS = 8000;
// Mermaid's parse errors quote the offending line; the first part is enough
// for the model to locate the problem.
export const MAX_ERROR_CHARS = 1000;

export interface DiagramRequest {
  prompt: string;
  /** Present on the second attempt: the diagram that failed and why. */
  repair?: { code: string; error: string };
}

type ParseResult =
  | { ok: true; request: DiagramRequest }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseDiagramRequest(body: unknown): ParseResult {
  if (!isRecord(body)) return { ok: false, error: 'Invalid request.' };

  const { prompt, repair } = body;
  if (
    typeof prompt !== 'string' ||
    !prompt.trim() ||
    prompt.length > MAX_PROMPT_CHARS
  ) {
    return {
      ok: false,
      error: `Describe your flow in 1–${MAX_PROMPT_CHARS} characters.`,
    };
  }

  if (repair === undefined) return { ok: true, request: { prompt } };

  if (
    !isRecord(repair) ||
    typeof repair.code !== 'string' ||
    typeof repair.error !== 'string' ||
    !repair.code.trim() ||
    repair.code.length > MAX_CODE_CHARS
  ) {
    return { ok: false, error: 'Invalid repair request.' };
  }

  return {
    ok: true,
    request: {
      prompt,
      repair: {
        code: repair.code,
        error: repair.error.slice(0, MAX_ERROR_CHARS),
      },
    },
  };
}

// A repair is a single user turn, not a replayed assistant turn: the broken
// diagram comes back from the browser, so it's untrusted and must not be able to
// pose as the model's own output. Tags mark each part as data.
export function buildUserMessage({ prompt, repair }: DiagramRequest): string {
  if (!repair) return prompt;

  return [
    '<description>',
    prompt,
    '</description>',
    '',
    'This Mermaid diagram was generated for the description above, but it fails to parse:',
    '<diagram>',
    repair.code,
    '</diagram>',
    '',
    "Mermaid's parser reported:",
    '<parse_error>',
    repair.error,
    '</parse_error>',
    '',
    'Fix the syntax error and return the complete corrected diagram.',
  ].join('\n');
}

// The model sometimes wraps its answer in a code fence, or adds a sentence
// around it, despite the prompt. Take the fenced block if there is one; an
// unclosed fence (output cut off at max_tokens) runs to the end of the text.
const FENCED_BLOCK = /```[^\n]*\n([\s\S]*?)(?:```|$)/;

export function extractMermaid(text: string): string {
  const match = text.match(FENCED_BLOCK);
  return (match ? match[1] : text).trim();
}
