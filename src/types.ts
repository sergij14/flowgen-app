// Generation is modelled as an explicit state machine rather than a few loose
// booleans. This makes impossible states (e.g. "loading" and "error" at once)
// unrepresentable, and lets the UI render each branch exhaustively.
export type GenerationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; code: string }
  | { status: 'error'; message: string };

export type OutputTab = 'diagram' | 'code';
