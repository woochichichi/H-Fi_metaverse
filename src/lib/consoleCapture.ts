/**
 * 콘솔 로그 + fetch 에러 캡처 유틸리티
 * - main.tsx에서 가장 먼저 import하여 프로덕션 console 덮어쓰기 전에 설치
 * - 최근 MAX_ENTRIES건의 로그를 순환 버퍼에 보관
 * - 사이트 건의 제출 시 getCapuredLogs()로 조회
 */

const MAX_ENTRIES = 100;

export interface CapturedLog {
  level: 'log' | 'warn' | 'error' | 'network';
  message: string;
  timestamp: string;
}

const buffer: CapturedLog[] = [];

function push(entry: CapturedLog) {
  if (buffer.length >= MAX_ENTRIES) buffer.shift();
  buffer.push(entry);
}

function stringify(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a;
      try {
        return JSON.stringify(a, null, 0)?.slice(0, 500) ?? String(a);
      } catch {
        return String(a);
      }
    })
    .join(' ')
    .slice(0, 1000);
}

// --- console 인터셉트 ---
// 프로덕션에서는 원본 출력을 억제하되 버퍼에는 기록
const isProd = import.meta.env.PROD;
const origLog = console.log.bind(console);
const origWarn = console.warn.bind(console);
const origError = console.error.bind(console);

console.log = (...args: unknown[]) => {
  push({ level: 'log', message: stringify(args), timestamp: new Date().toISOString() });
  if (!isProd) origLog(...args);
};
console.warn = (...args: unknown[]) => {
  push({ level: 'warn', message: stringify(args), timestamp: new Date().toISOString() });
  if (!isProd) origWarn(...args);
};
console.error = (...args: unknown[]) => {
  push({ level: 'error', message: stringify(args), timestamp: new Date().toISOString() });
  if (!isProd) origError(...args);
};

// --- fetch 에러 인터셉트 ---
const origFetch = window.fetch.bind(window);
window.fetch = async (...args: Parameters<typeof fetch>) => {
  try {
    const res = await origFetch(...args);
    if (!res.ok) {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0]);
      push({
        level: 'network',
        message: `[${res.status}] ${res.statusText} — ${url.slice(0, 200)}`,
        timestamp: new Date().toISOString(),
      });
    }
    return res;
  } catch (err) {
    const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0]);
    push({
      level: 'network',
      message: `FETCH_FAIL — ${url.slice(0, 200)}: ${err instanceof Error ? err.message : String(err)}`,
      timestamp: new Date().toISOString(),
    });
    throw err;
  }
};

// --- 전역 에러 캡처 ---
window.addEventListener('error', (e) => {
  push({
    level: 'error',
    message: `[Uncaught] ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`,
    timestamp: new Date().toISOString(),
  });
});

window.addEventListener('unhandledrejection', (e) => {
  push({
    level: 'error',
    message: `[UnhandledRejection] ${e.reason instanceof Error ? e.reason.message : String(e.reason)}`,
    timestamp: new Date().toISOString(),
  });
});

// --- 외부 API ---
export function getCapturedLogs(): CapturedLog[] {
  return [...buffer];
}

export function getCapturedLogsText(): string {
  return buffer
    .map((e) => `[${e.timestamp.slice(11, 23)}][${e.level.toUpperCase()}] ${e.message}`)
    .join('\n');
}
