import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg-primary">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <span className="text-5xl">⚠️</span>
            <h1 className="font-heading text-lg font-bold text-text-primary">
              문제가 발생했습니다
            </h1>
            <p className="text-sm text-text-muted max-w-xs">
              예상치 못한 오류가 발생했습니다. 새로고침하면 대부분 해결됩니다.
            </p>
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/80"
            >
              <RefreshCw size={16} />
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
