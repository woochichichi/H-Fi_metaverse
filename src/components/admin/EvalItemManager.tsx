import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { useCustomEvalItems } from '../../hooks/useCustomEvalItems';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { TEAMS } from '../../lib/constants';
import type { CustomEvalItem } from '../../types';

export default function EvalItemManager() {
  const { profile, user } = useAuthStore();
  const { addToast } = useUiStore();
  const { items, loading, fetchAllItems, createItem, updateItem, deleteItem } =
    useCustomEvalItems();

  const canSeeAll = profile?.role === 'admin' || profile?.role === 'director';
  const [filterTeam, setFilterTeam] = useState(canSeeAll ? '' : profile?.team ?? '');
  const [showForm, setShowForm] = useState(false);

  // 폼 상태
  const [formTeam, setFormTeam] = useState(canSeeAll ? (TEAMS[0] as string) : profile?.team ?? '');
  const [formName, setFormName] = useState('');
  const [formPoints, setFormPoints] = useState(1);

  const load = useCallback(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filterTeam
    ? items.filter((i) => i.team === filterTeam)
    : items;

  // leader는 자기 팀 항목만 표시
  const visibleItems = canSeeAll
    ? filtered
    : filtered.filter((i) => i.team === profile?.team);

  const handleCreate = async () => {
    if (!formName.trim()) {
      addToast('항목 이름을 입력하세요', 'error');
      return;
    }
    const targetTeam = canSeeAll ? formTeam : (profile?.team ?? '');
    const { error } = await createItem(targetTeam, formName.trim(), formPoints, user?.id ?? '');
    if (error) {
      addToast('생성 실패: ' + error, 'error');
      return;
    }
    addToast('평가 항목이 추가되었습니다', 'success');
    setShowForm(false);
    setFormName('');
    setFormPoints(1);
    load();
  };

  const handleDelete = async (item: CustomEvalItem) => {
    const { error } = await deleteItem(item.id);
    if (error) {
      addToast('삭제 실패: ' + error, 'error');
      return;
    }
    addToast('항목이 비활성화되었습니다', 'success');
    load();
  };

  const handlePointsChange = async (item: CustomEvalItem, newPoints: number) => {
    const { error } = await updateItem(item.id, { points: newPoints });
    if (error) {
      addToast('수정 실패: ' + error, 'error');
      return;
    }
    load();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">팀별 평가 항목 관리</h3>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1 rounded-lg border border-white/[.08] px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-white/[.06]"
          >
            <RefreshCw size={12} /> 새로고침
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent/80"
          >
            <Plus size={12} /> 항목 추가
          </button>
        </div>
      </div>

      {/* 팀 필터 */}
      {canSeeAll && (
        <div className="flex gap-2">
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="rounded-lg border border-white/[.1] bg-bg-primary px-3 py-1.5 text-xs text-text-primary"
          >
            <option value="">전체 팀</option>
            {TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {/* 생성 폼 */}
      {showForm && (
        <div className="rounded-xl border border-white/[.08] bg-white/[.03] p-4">
          <div className="grid grid-cols-3 gap-3">
            {canSeeAll && (
              <div>
                <label className="mb-1 block text-[11px] text-text-muted">대상 팀</label>
                <select
                  value={formTeam}
                  onChange={(e) => setFormTeam(e.target.value)}
                  className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary"
                >
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={canSeeAll ? '' : 'col-span-2'}>
              <label className="mb-1 block text-[11px] text-text-muted">항목 이름</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="예: 고객응대, 팀미팅 참석"
                className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-text-muted">포인트</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={formPoints}
                onChange={(e) => setFormPoints(Number(e.target.value))}
                className="w-full rounded-lg border border-white/[.1] bg-bg-primary px-3 py-2 text-xs text-text-primary"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-1.5 text-xs text-text-muted hover:bg-white/[.06]"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent/80"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* 항목 목록 */}
      {loading ? (
        <div className="py-8 text-center text-sm text-text-muted">로딩 중...</div>
      ) : visibleItems.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-muted">
          {items.length === 0
            ? '등록된 커스텀 평가 항목이 없습니다'
            : '해당 팀에 등록된 항목이 없습니다'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[.06]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[.06] bg-white/[.03]">
                <th className="px-3 py-2 text-left font-semibold text-text-muted">팀</th>
                <th className="px-3 py-2 text-left font-semibold text-text-muted">항목 이름</th>
                <th className="px-3 py-2 text-center font-semibold text-text-muted">포인트</th>
                <th className="px-3 py-2 text-center font-semibold text-text-muted">상태</th>
                <th className="px-3 py-2 text-center font-semibold text-text-muted">액션</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id} className="border-b border-white/[.04] transition-colors hover:bg-white/[.02]">
                  <td className="px-3 py-2 text-text-secondary">{item.team}</td>
                  <td className="px-3 py-2 text-text-primary font-medium">{item.name}</td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={item.points}
                      onChange={(e) => handlePointsChange(item, Number(e.target.value))}
                      className="w-16 rounded-md border border-white/[.1] bg-bg-primary px-2 py-0.5 text-center text-[11px] text-text-primary"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.active ? 'bg-success/20 text-success' : 'bg-white/[.08] text-text-muted'
                    }`}>
                      {item.active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleDelete(item)}
                      className="rounded p-1 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      title="비활성화"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-text-muted">
        커스텀 항목은 해당 팀의 평가 대시보드에서만 표시됩니다. 삭제 시 비활성화되며 기존 기록은 유지됩니다.
      </p>
    </div>
  );
}
