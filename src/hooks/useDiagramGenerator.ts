import { useCallback, useEffect, useRef, useState } from 'react';
import { validateMermaid } from '../lib/mermaid';
import { generateMermaid } from '../services/diagram';
import {
  generateDiagram,
  type DiagramPipeline,
} from '../services/generateDiagram';
import type { GenerationState } from '../types';

interface DiagramGenerator {
  state: GenerationState;
  generate: (prompt: string) => void;
  cancel: () => void;
}

const pipeline: DiagramPipeline = {
  request: generateMermaid,
  validate: validateMermaid,
};

export function useDiagramGenerator(): DiagramGenerator {
  const [state, setState] = useState<GenerationState>({ status: 'idle' });

  // Track the in-flight request so a new generation (or an unmount) can abort the
  // previous one — otherwise a slow response could land after a newer one and
  // clobber the UI. The same signal covers the repair request.
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState((prev) =>
      prev.status === 'loading' || prev.status === 'repairing'
        ? { status: 'idle' }
        : prev,
    );
  }, []);

  const generate = useCallback((prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState({ status: 'loading' });

    const onRepair = (error: string) => {
      if (!controller.signal.aborted) setState({ status: 'repairing', error });
    };

    generateDiagram(trimmed, controller.signal, pipeline, onRepair)
      .then(({ code, repaired }) => {
        if (controller.signal.aborted) return;
        setState({ status: 'success', code, repaired });
      })
      .catch((err: unknown) => {
        // Aborts are intentional (a newer request, or the user pressing Stop) —
        // never surface them as errors.
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : 'Something went wrong.';
        setState({ status: 'error', message });
      });
  }, []);

  // Abort any in-flight request when the component unmounts.
  useEffect(() => () => controllerRef.current?.abort(), []);

  return { state, generate, cancel };
}
