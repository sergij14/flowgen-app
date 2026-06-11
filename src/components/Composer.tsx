import { useState, type KeyboardEvent } from 'react';
import { EXAMPLE_PROMPTS } from '../constants';

interface Props {
  isLoading: boolean;
  onGenerate: (prompt: string) => void;
  onCancel: () => void;
}

export function Composer({ isLoading, onGenerate, onCancel }: Props) {
  const [prompt, setPrompt] = useState('');

  const submit = () => onGenerate(prompt);

  // Cmd/Ctrl+Enter submits — the conventional "send" shortcut inside a textarea,
  // where a bare Enter has to stay free for newlines.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section className="composer" aria-label="Describe a flow">
      <label className="composer__label" htmlFor="prompt">
        Describe a flow
      </label>

      <textarea
        id="prompt"
        className="composer__input"
        placeholder="e.g. OAuth login with refresh tokens"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={5}
        spellCheck={false}
      />

      <div className="composer__examples">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            type="button"
            className="chip"
            onClick={() => setPrompt(example)}
            disabled={isLoading}
          >
            {example}
          </button>
        ))}
      </div>

      <div className="composer__actions">
        {isLoading ? (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Stop
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={submit}
            disabled={!prompt.trim()}
          >
            Generate diagram
          </button>
        )}
        <kbd className="composer__hint">⌘ / Ctrl + ↵</kbd>
      </div>
    </section>
  );
}
