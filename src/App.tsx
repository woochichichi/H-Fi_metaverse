import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import MainPage from './routes/MainPage';
import LoginPage from './routes/LoginPage';
import RegisterPage from './routes/RegisterPage';
import ResetPasswordPage from './routes/ResetPasswordPage';
import SurveyPage from './routes/SurveyPage';
import StyleSelectorPage from './routes/StyleSelectorPage';
import Toast from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-bg-tertiary border-t-accent" />
          <span className="text-sm text-text-muted">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-bg-tertiary border-t-accent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        {/* recovery 토큰을 처리해야 하므로 PublicRoute 밖에 독립 배치 */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/survey/:slug?" element={<SurveyPage />} />
        <Route
          path="/ui-version"
          element={
            <ProtectedRoute>
              <StyleSelectorPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
