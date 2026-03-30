import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { checkNicknameAvailable } from '../../hooks/useAuth';

interface NicknameEditorProps {
  onClose: () => void;
}

export default function NicknameEditor({ onClose }: NicknameEditorProps) {
  const { profile, user, fetchProfile } = useAuthStore();
  const { addToast } = useUiStore();
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [saving, setSaving] = useState(false);

  const handleCheck = async () => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length < 1 || trimmed.length > 10) {
      setStatus('idle');
      return;
    }
    if (trimmed === profile?.nickname) {
      setStatus('idle');
      return;
    }
    setStatus('checking');
    const available = await checkNicknameAvailable(trimmed);
    setStatus(available ? 'available' : 'taken');
  };

  const handleSave = async () => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length > 10) {
      addToast('별명은 1~10자로 입력해주세요', 'error');
      return;
    }
    if (trimmed === profile?.nickname) {
      onClose();
      return;
    }
    if (status === 'taken') {
      addToast('이미 사용 중인 별명입니다', 'error');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nickname: trimmed })
      .eq('id', user!.id);

    if (error) {
      addToast(error.message.includes('unique') ? '이미 사용 중인 별명입니다' : '변경 실패: ' + error.message, 'error');
      setSaving(false);
      return;
    }

    await fetchProfile(user!.id);
    addToast('별명이 변경되었습니다', 'success');
    setSaving(false);
    onClose();
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[300] bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[301] w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[.08] bg-bg-secondary p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h4 className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
            <Pencil size={14} /> 별명 변경
          </h4>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-text-muted">현재 별명</label>
            <p className="text-sm text-text-primary">{profile?.nickname || '(미설정)'}</p>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-text-muted">새 별명 (1~10자)</label>
            <div className="relative">
              <input
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setStatus('idle');
                }}
                onBlur={handleCheck}
                maxLength={10}
                className={`w-full rounded-lg bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none ring-1 transition-colors focus:ring-accent ${
                  status === 'taken'
                    ? 'ring-danger'
                    : status === 'available'
                      ? 'ring-success'
                      : 'ring-bg-tertiary'
                }`}
              />
              {status === 'checking' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">확인 중...</span>
              )}
              {status === 'available' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-success">사용 가능</span>
              )}
              {status === 'taken' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-danger">이미 사용 중</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-1.5 text-xs text-text-muted hover:bg-white/[.06]"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || status === 'taken' || !nickname.trim()}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent/80 disabled:opacity-40"
            >
              {saving ? '저장 중...' : '변경'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
