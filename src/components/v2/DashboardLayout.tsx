import V2Sidebar from './Sidebar';
import V2TopBar from './TopBar';

interface Props {
  children: React.ReactNode;
  themeClass?: string;
}

/**
 * v2 대시보드 레이아웃 셸.
 * themeClass ('v2-warm' | 'v2-dark')로 CSS 토큰 스코프를 선택.
 * 전역 레트로 규칙(index.css)을 v2 스코프로 격리.
 */
export default function DashboardLayout({ children, themeClass = 'v2-warm' }: Props) {
  return (
    <div
      className={themeClass}
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        background: 'var(--w-bg)',
      }}
    >
      <V2Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <V2TopBar />
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
