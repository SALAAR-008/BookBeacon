import { Component, type ReactNode } from 'react';
import { Library, RefreshCw } from 'lucide-react';

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('BookBeacon render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-50 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-400/20">
              <Library className="w-9 h-9 text-navy-900" />
            </div>
            <h1 className="font-display font-bold text-2xl text-navy-900">
              Something went wrong
            </h1>
            <p className="text-navy-500 mt-2 text-sm">
              BookBeacon hit an unexpected error while rendering.
            </p>
            {this.state.message && (
              <p className="mt-3 text-xs text-navy-400 bg-white rounded-lg border border-navy-100 p-3 font-mono break-all">
                {this.state.message}
              </p>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, message: undefined });
                window.location.reload();
              }}
              className="mt-6 px-5 py-2.5 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
