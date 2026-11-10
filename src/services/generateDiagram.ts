import type { DiagramRequest } from '../../netlify/lib/diagram-request';

export interface DiagramPipeline {
  /** Ask the model for Mermaid source. */
  request: (body: DiagramRequest, signal: AbortSignal) => Promise<string>;
  /** Resolve to the parser's error message, or null when the source parses. */
  validate: (code: string) => Promise<string | null>;
}

export interface DiagramResult {
  code: string;
  /** True when the first draft failed to parse and a repair was requested. */
  repaired: boolean;
}

// Generate a diagram, check it against Mermaid's real parser, and if it doesn't
// parse, send the source and the parser's error back for one repair. A single
// retry fixes most mistakes; more would multiply cost and latency for diagrams
// the model keeps getting wrong.
//
// If the repair still doesn't parse it's returned anyway: the renderer shows the
// parse error next to the source, which is more useful than a generic failure.
export async function generateDiagram(
  prompt: string,
  signal: AbortSignal,
  pipeline: DiagramPipeline,
  onRepair?: (error: string) => void,
): Promise<DiagramResult> {
  const draft = await pipeline.request({ prompt }, signal);
  const error = await pipeline.validate(draft);
  if (error === null) return { code: draft, repaired: false };

  // Parsing is async — the user may have pressed Stop or started a new
  // generation in the meantime, and a repair would then be wasted quota.
  signal.throwIfAborted();
  onRepair?.(error);

  const code = await pipeline.request(
    { prompt, repair: { code: draft, error } },
    signal,
  );
  return { code, repaired: true };
}
