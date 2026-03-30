export default function MainPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-accent">
          ITO 메타버스
        </h1>
        <p className="mt-4 text-text-secondary">
          금융ITO 조직문화 플랫폼
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <span className="rounded-lg bg-bg-secondary px-4 py-2 text-sm text-text-muted">
            Sprint 0 완료
          </span>
        </div>
      </div>
    </div>
  );
}
