import { describe, expect, it } from 'vitest';
import {
  MAX_CODE_CHARS,
  MAX_ERROR_CHARS,
  MAX_PROMPT_CHARS,
  buildUserMessage,
  extractMermaid,
  parseDiagramRequest,
} from './diagram-request';

describe('extractMermaid', () => {
  const diagram = 'flowchart TD\n  A[Start] --> B[End]';

  it('returns bare Mermaid unchanged', () => {
    expect(extractMermaid(`${diagram}\n`)).toBe(diagram);
  });

  it('strips a ```mermaid fence', () => {
    expect(extractMermaid('```mermaid\n' + diagram + '\n```')).toBe(diagram);
  });

  it('strips a fence with no language tag', () => {
    expect(extractMermaid('```\n' + diagram + '\n```')).toBe(diagram);
  });

  it('drops prose around a fenced block', () => {
    const text = `Here is your diagram:\n\n\`\`\`mermaid\n${diagram}\n\`\`\`\n\nLet me know if you want changes.`;
    expect(extractMermaid(text)).toBe(diagram);
  });

  it('handles a fence left open when output hits max_tokens', () => {
    expect(extractMermaid('```mermaid\n' + diagram)).toBe(diagram);
  });
});

describe('parseDiagramRequest', () => {
  it('accepts a plain prompt', () => {
    expect(parseDiagramRequest({ prompt: 'OAuth login' })).toEqual({
      ok: true,
      request: { prompt: 'OAuth login' },
    });
  });

  it.each([
    ['a non-object body', null],
    ['a missing prompt', {}],
    ['a blank prompt', { prompt: '   ' }],
    ['a non-string prompt', { prompt: 42 }],
    ['an over-long prompt', { prompt: 'x'.repeat(MAX_PROMPT_CHARS + 1) }],
  ])('rejects %s', (_label, body) => {
    expect(parseDiagramRequest(body).ok).toBe(false);
  });

  it('accepts a repair and truncates a long parser error', () => {
    const result = parseDiagramRequest({
      prompt: 'OAuth login',
      repair: { code: 'flowchart TD\n A -->', error: 'e'.repeat(5000) },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.repair?.code).toBe('flowchart TD\n A -->');
      expect(result.request.repair?.error).toHaveLength(MAX_ERROR_CHARS);
    }
  });

  it.each([
    ['a non-object repair', 'oops'],
    ['missing code', { error: 'Parse error' }],
    ['missing error', { code: 'flowchart TD' }],
    ['blank code', { code: ' ', error: 'Parse error' }],
    ['over-long code', { code: 'x'.repeat(MAX_CODE_CHARS + 1), error: 'e' }],
  ])('rejects a repair with %s', (_label, repair) => {
    expect(parseDiagramRequest({ prompt: 'OAuth login', repair }).ok).toBe(
      false,
    );
  });
});

describe('buildUserMessage', () => {
  it('sends a first attempt as the bare prompt', () => {
    expect(buildUserMessage({ prompt: 'OAuth login' })).toBe('OAuth login');
  });

  it('wraps each part of a repair in its own tag', () => {
    const message = buildUserMessage({
      prompt: 'OAuth login',
      repair: { code: 'flowchart TD\n A -->', error: 'Parse error on line 2' },
    });

    expect(message).toContain('<description>\nOAuth login\n</description>');
    expect(message).toContain('<diagram>\nflowchart TD\n A -->\n</diagram>');
    expect(message).toContain(
      '<parse_error>\nParse error on line 2\n</parse_error>',
    );
  });
});
