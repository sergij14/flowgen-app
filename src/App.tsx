import { useDiagramGenerator } from './hooks/useDiagramGenerator';
import { Composer } from './components/Composer';
import { DiagramPanel } from './components/DiagramPanel';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { state, generate, cancel } = useDiagramGenerator();

  return (
    <div className="app">
      <header className="app__header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            ◇
          </span>
          <div>
            <h1 className="brand__name">Flowgen</h1>
            <p className="brand__tagline">Describe a flow — get a diagram.</p>
          </div>
        </div>
      </header>

      <main className="app__main">
        <Composer
          isLoading={state.status === 'loading'}
          onGenerate={generate}
          onCancel={cancel}
        />
        <ErrorBoundary>
          <DiagramPanel state={state} />
        </ErrorBoundary>
      </main>
    </div>
  );
}
