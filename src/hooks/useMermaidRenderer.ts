import { useEffect, useState } from 'react';
import { renderMermaid } from '../lib/mermaid';

interface RendererState {
  svg: string | null;
  error: string | null;
  isRendering: boolean;
}

// Renders Mermaid source to SVG whenever `code` changes. Rendering is async, so we
// guard against races: if `code` changes again before a render resolves, the stale
// result is dropped via the `cancelled` flag set in the effect's cleanup.
export function useMermaidRenderer(code: string | null): RendererState {
  const [state, setState] = useState<RendererState>({
    svg: null,
    error: null,
    isRendering: false,
  });

  useEffect(() => {
    if (!code) {
      setState({ svg: null, error: null, isRendering: false });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isRendering: true, error: null }));

    renderMermaid(code)
      .then((svg) => {
        if (!cancelled) setState({ svg, error: null, isRendering: false });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Failed to render diagram.';
        setState({ svg: null, error: message, isRendering: false });
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  return state;
}
