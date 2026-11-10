import { describe, expect, it, vi } from 'vitest';
import { generateDiagram, type DiagramPipeline } from './generateDiagram';

const VALID = 'flowchart TD\n  A --> B';
const BROKEN = 'flowchart TD\n  A -->';
const FIXED = 'flowchart TD\n  A --> B[Done]';
const PARSE_ERROR = "Parse error on line 2:\n...A -->\n------^\nExpecting 'NODE'";

// A fake pipeline: `responses` are returned by successive model calls, and any
// source listed in `invalid` fails validation with PARSE_ERROR.
function fakePipeline(responses: string[], invalid: string[] = []) {
  const request = vi.fn<DiagramPipeline['request']>();
  for (const response of responses) request.mockResolvedValueOnce(response);

  const validate = vi.fn<DiagramPipeline['validate']>(async (code) =>
    invalid.includes(code) ? PARSE_ERROR : null,
  );

  return { request, validate };
}

describe('generateDiagram', () => {
  it('returns a draft that parses without asking for a repair', async () => {
    const pipeline = fakePipeline([VALID]);
    const onRepair = vi.fn();

    const result = await generateDiagram(
      'OAuth login',
      new AbortController().signal,
      pipeline,
      onRepair,
    );

    expect(result).toEqual({ code: VALID, repaired: false });
    expect(pipeline.request).toHaveBeenCalledTimes(1);
    expect(onRepair).not.toHaveBeenCalled();
  });

  it('sends a draft that fails to parse back with the parser error', async () => {
    const pipeline = fakePipeline([BROKEN, FIXED], [BROKEN]);
    const onRepair = vi.fn();
    const { signal } = new AbortController();

    const result = await generateDiagram(
      'OAuth login',
      signal,
      pipeline,
      onRepair,
    );

    expect(result).toEqual({ code: FIXED, repaired: true });
    expect(onRepair).toHaveBeenCalledWith(PARSE_ERROR);
    expect(pipeline.request).toHaveBeenLastCalledWith(
      { prompt: 'OAuth login', repair: { code: BROKEN, error: PARSE_ERROR } },
      signal,
    );
  });

  it('tries a repair only once and returns it even if it still fails', async () => {
    const pipeline = fakePipeline([BROKEN, BROKEN], [BROKEN]);

    const result = await generateDiagram(
      'OAuth login',
      new AbortController().signal,
      pipeline,
    );

    // The renderer shows the parse error next to the source from here.
    expect(result).toEqual({ code: BROKEN, repaired: true });
    expect(pipeline.request).toHaveBeenCalledTimes(2);
  });

  it('skips the repair when cancelled while the draft was being validated', async () => {
    const controller = new AbortController();
    const pipeline = fakePipeline([BROKEN], [BROKEN]);
    pipeline.validate.mockImplementationOnce(async () => {
      controller.abort();
      return PARSE_ERROR;
    });
    const onRepair = vi.fn();

    await expect(
      generateDiagram('OAuth login', controller.signal, pipeline, onRepair),
    ).rejects.toThrow();

    expect(pipeline.request).toHaveBeenCalledTimes(1);
    expect(onRepair).not.toHaveBeenCalled();
  });

  it('propagates a failed model request', async () => {
    const pipeline = fakePipeline([]);
    pipeline.request.mockRejectedValueOnce(new Error('Too many requests'));

    await expect(
      generateDiagram('OAuth login', new AbortController().signal, pipeline),
    ).rejects.toThrow('Too many requests');
    expect(pipeline.validate).not.toHaveBeenCalled();
  });
});
