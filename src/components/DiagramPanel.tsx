import { useState } from 'react';
import { useMermaidRenderer } from '../hooks/useMermaidRenderer';
import type { GenerationState, OutputTab } from '../types';

// Mermaid's parse errors span several lines (message, quoted source, caret);
// the first line is enough for a status hint.
function firstLine(text: string): string {
  return text.split('\n', 1)[0];
}

interface Props {
  state: GenerationState;
}

export function DiagramPanel({ state }: Props) {
  const [tab, setTab] = useState<OutputTab>('diagram');
  const [copied, setCopied] = useState(false);

  // Hooks must run in the same order every render, so the renderer is always
  // called and simply fed `null` until there's a diagram to draw.
  const code = state.status === 'success' ? state.code : null;
  const { svg, error: renderError, isRendering } = useMermaidRenderer(code);

  if (state.status === 'idle') {
    return (
      <div className="panel panel--empty">
        <p className="panel__hint">
          Describe a flow and Haiku will draw it as a Mermaid diagram.
        </p>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="panel panel--empty">
        <div className="spinner" aria-label="Generating diagram" />
        <p className="panel__hint">Generating…</p>
      </div>
    );
  }

  if (state.status === 'repairing') {
    return (
      <div className="panel panel--empty">
        <div className="spinner" aria-label="Fixing diagram syntax" />
        <p className="panel__hint">
          The first draft didn’t parse — asking Haiku to fix it…
        </p>
        <p className="panel__detail" title={state.error}>
          {firstLine(state.error)}
        </p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="panel panel--empty">
        <div className="panel__error" role="alert">
          <strong>Generation failed.</strong>
          <p>{state.message}</p>
        </div>
      </div>
    );
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(state.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const downloadSvg = () => {
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'diagram.svg';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel">
      <div className="panel__toolbar">
        <div className="tabs" role="tablist" aria-label="Output view">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'diagram'}
            className="tab"
            onClick={() => setTab('diagram')}
          >
            Diagram
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'code'}
            className="tab"
            onClick={() => setTab('code')}
          >
            Code
          </button>
        </div>

        <div className="panel__tools">
          {state.repaired && !renderError && (
            <span
              className="badge"
              title="The first draft had a syntax error and was fixed automatically."
            >
              Auto-fixed
            </span>
          )}
          <button type="button" className="btn btn--ghost" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy code'}
          </button>
          {tab === 'diagram' && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={downloadSvg}
              disabled={!svg}
            >
              Download SVG
            </button>
          )}
        </div>
      </div>

      <div className="panel__body">
        {tab === 'code' ? (
          <pre className="code">
            <code>{state.code}</code>
          </pre>
        ) : renderError ? (
          <div className="panel__error" role="alert">
            <strong>
              {state.repaired
                ? 'Couldn’t render this diagram, even after an automatic fix.'
                : 'Couldn’t render this diagram.'}
            </strong>
            <p>{renderError}</p>
          </div>
        ) : (
          <div
            className="diagram__canvas"
            aria-busy={isRendering}
            // Safe: the SVG comes from Mermaid configured with securityLevel
            // 'strict', so it's sanitised before it reaches the DOM here.
            dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
          />
        )}
      </div>
    </div>
  );
}
