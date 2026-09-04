/**
 * Last line of defence.
 *
 * React unmounts the whole tree when a render throws, which leaves an empty
 * page and no way back except knowing to reload. Anything unexpected should
 * still leave something on screen to act on.
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="card w-full max-w-md px-5 py-6 text-center">
          <h1 className="text-base font-semibold text-ink">Something broke on this screen</h1>
          <p className="mt-2 text-sm text-muted">
            Your data is safe. Reloading usually fixes it.
          </p>
          <p className="mt-3 break-words rounded-xl bg-canvas px-3 py-2 text-xs text-muted">
            {this.state.error.message}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" className="btn-ghost" onClick={() => this.setState({ error: null })}>
              Try again
            </button>
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
