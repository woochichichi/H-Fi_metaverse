import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Eye, Sparkles } from 'lucide-react';
import { useThemeStore, UI_VERSIONS, type UiVersion } from '../stores/themeStore';
import { useUiStore } from '../stores/uiStore';

/**
 * UI 버전 선택 페이지 — 클릭 한 번 = 즉시 적용.
 * (이전: 체크 후 우측 상단 "적용하기" 2단계 → 현재: 카드 클릭 = setVersion)
 */
export default function StyleSelectorPage() {
  const navigate = useNavigate();
  const { version: currentVersion, setVersion } = useThemeStore();
  const addToast = useUiStore((s) => s.addToast);
  const [previewOf, setPreviewOf] = useState<UiVersion | null>(null);

  const previewMeta = previewOf ? UI_VERSIONS.find((v) => v.id === previewOf) : null;

  const handlePick = (id: UiVersion) => {
    const meta = UI_VERSIONS.find((v) => v.id === id)!;
    if (id !== currentVersion) {
      setVersion(id);
      addToast(`'${meta.name}'로 바뀌었어요`, 'success');
    }
    // 테마 적용 후 즉시 메인으로 이동 — 사용자가 적용 결과를 바로 봄
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 text-slate-900">
      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={16} /> 돌아가기
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-orange-500" />
              <h1 className="text-lg font-bold">디자인 테마 선택</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              카드를 클릭하면 바로 적용돼요. 언제든 다시 바꿀 수 있어요.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* 현재 적용 상태 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center">
            <Check size={18} />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500">지금 사용 중</div>
            <div className="font-semibold mt-0.5">
              {UI_VERSIONS.find((v) => v.id === currentVersion)?.name}
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
            {currentVersion}
          </span>
        </div>

        {/* 버전 카드 그리드 — 클릭 즉시 적용 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {UI_VERSIONS.map((v) => {
            const isCurrent = currentVersion === v.id;
            return (
              <article
                key={v.id}
                onClick={() => handlePick(v.id)}
                className={`group relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-100'
                    : 'border-slate-200 hover:border-slate-400 hover:shadow-md'
                }`}
              >
                {/* 상단 메타 */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base">{v.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-semibold inline-flex items-center gap-1">
                          <Check size={10} /> 사용 중
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{v.tagline}</p>
                  </div>
                  <div
                    className={`shrink-0 w-6 h-6 rounded-full border-2 grid place-items-center transition-all ${
                      isCurrent
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'bg-white border-slate-300 group-hover:border-slate-500'
                    }`}
                  >
                    {isCurrent && <Check size={14} className="text-white" />}
                  </div>
                </div>

                {/* 미리보기 */}
                <div
                  className={`relative h-[360px] overflow-hidden border-t border-slate-100 ${
                    v.mode === 'dark' ? 'bg-slate-950' : v.mode === 'warm' ? 'bg-amber-50' : 'bg-slate-50'
                  }`}
                >
                  {v.preview ? (
                    <iframe
                      src={v.preview}
                      title={v.name}
                      className="border-0 bg-white pointer-events-none"
                      style={{
                        width: '1440px',
                        height: '900px',
                        transform: 'scale(0.42)',
                        transformOrigin: 'top left',
                      }}
                    />
                  ) : (
                    <div className="h-full grid place-items-center text-slate-400 text-sm">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🗺️</div>
                        <div className="font-medium">기존 메타버스 맵 화면</div>
                        <div className="text-xs mt-1">캐릭터 · 포탈 · 존 기반 UI</div>
                      </div>
                    </div>
                  )}
                  {v.preview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewOf(v.id);
                      }}
                      className="absolute right-3 top-3 h-8 px-3 rounded-md bg-white/95 backdrop-blur shadow text-xs font-semibold text-slate-700 hover:bg-white flex items-center gap-1.5"
                    >
                      <Eye size={13} /> 크게 보기
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* 안내 */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <b>참고</b> · 카드를 누르면 바로 반영됩니다. 돌아가기를 눌러 화면을 확인해보세요.
        </div>
      </main>

      {/* Full preview modal */}
      {previewMeta && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex flex-col"
          onClick={() => setPreviewOf(null)}
        >
          <div className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
            <div className="font-semibold">{previewMeta.name} · 전체 미리보기</div>
            <span className="text-xs text-slate-500">{previewMeta.tagline}</span>
            <button
              onClick={() => setPreviewOf(null)}
              className="ml-auto h-9 px-3 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              닫기 ✕
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePick(previewMeta.id);
                setPreviewOf(null);
              }}
              className="h-9 px-4 rounded-md bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600"
            >
              이 디자인 적용
            </button>
          </div>
          <iframe
            src={previewMeta.preview}
            title={previewMeta.name}
            className="flex-1 w-full border-0 bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
