import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, componentStack: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught:', error);
    console.error('[ErrorBoundary] component stack:', info.componentStack);
    this.setState({ componentStack: info.componentStack ?? null });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleCopy = () => {
    const { error, componentStack } = this.state;
    const text = [
      `Error: ${error?.name ?? 'Unknown'}: ${error?.message ?? ''}`,
      '',
      'Stack:',
      error?.stack ?? '(no stack)',
      '',
      'Component stack:',
      componentStack ?? '(no component stack)',
    ].join('\n');
    void navigator.clipboard?.writeText(text);
  };

  render() {
    if (this.state.hasError) {
      const { error, componentStack } = this.state;
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg-primary">
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center max-w-2xl w-full">
            <span className="text-5xl">⚠️</span>
            <h1 className="font-heading text-lg font-bold text-text-primary">
              문제가 발생했습니다
            </h1>
            <p className="text-sm text-text-muted max-w-xs">
              예상치 못한 오류가 발생했습니다. 새로고침하면 대부분 해결됩니다.
            </p>

            {/* 에러 상세 — 진단용 (사용자가 복사해서 개발자에게 전달 가능) */}
            {error && (
              <div
                className="w-full text-left rounded-lg border border-red-300/50 bg-red-50/30 dark:bg-red-950/20 p-3"
                style={{ fontFamily: 'monospace', fontSize: 11 }}
              >
                <div style={{ color: '#c33', fontWeight: 700, marginBottom: 4 }}>
                  {error.name}: {error.message}
                </div>
                {error.stack && (
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ cursor: 'pointer', fontSize: 10.5, color: '#666' }}>
                      stack trace
                    </summary>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: 200,
                        overflow: 'auto',
                        fontSize: 10.5,
                        color: '#555',
                        marginTop: 4,
                      }}
                    >
                      {error.stack}
                    </pre>
                  </details>
                )}
                {componentStack && (
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ cursor: 'pointer', fontSize: 10.5, color: '#666' }}>
                      component stack
                    </summary>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: 200,
                        overflow: 'auto',
                        fontSize: 10.5,
                        color: '#555',
                        marginTop: 4,
                      }}
                    >
                      {componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/80"
              >
                <RefreshCw size={16} />
                새로고침
              </button>
              {error && (
                <button
                  onClick={this.handleCopy}
                  className="flex items-center gap-2 rounded-xl border border-text-muted/30 px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-black/5 dark:hover:bg-white/5"
                >
                  에러 내용 복사
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
