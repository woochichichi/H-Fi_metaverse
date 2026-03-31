// 콘솔 캡처 + 프로덕션 console 억제를 한곳에서 처리
import './lib/consoleCapture';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
