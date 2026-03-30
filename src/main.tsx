import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// 프로덕션 환경에서 콘솔 로그 비활성화 (내부 정보 노출 방지)
if (import.meta.env.PROD) {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.error = noop;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
