import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Last-resort guard so a render-time crash (e.g. an unexpected Mermaid failure)
// degrades to a recoverable message instead of a blank screen. Error boundaries
// still have to be class components in React.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="panel panel--empty">
          <div className="panel__error" role="alert">
            <strong>Something broke.</strong>
            <p>{this.state.error.message}</p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
