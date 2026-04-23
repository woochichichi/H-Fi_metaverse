import V2Sidebar from './Sidebar';
import V2TopBar from './TopBar';

interface Props {
  children: React.ReactNode;
}

/**
 * v2 Modern Dark 레이아웃 셸.
 * 전체를 .v2-dark 스코프로 감싸서 index.css의 전역 레트로 규칙을 격리한다.
 */
export default function DashboardLayout({ children }: Props) {
  return (
    <div
      className="v2-dark"
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
