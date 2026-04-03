import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../stores/uiStore';
import { useMetaverseStore } from '../stores/metaverseStore';

const POLL_MS = 5 * 60 * 1000;   // 5분마다 폴링
const GRACE_MS = 30 * 60 * 1000; // 토스트 무시 후 30분 지나면 idle 시 자동 새로고침

function isIdle(modalOpen: string | null): boolean {
  if (modalOpen !== null) return false; // 패널/게임 열려있음
  const a = document.activeElement;
  return !(a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement);
}

export function useVersionCheck() {
  const addToast = useUiStore((s) => s.addToast);
  const modalOpen = useUiStore((s) => s.modalOpen);
  const currentRoom = useMetaverseStore((s) => s.currentRoom);

  // modalOpen을 타이머 콜백에서 참조하기 위한 ref
  const modalOpenRef = useRef(modalOpen);
  useEffect(() => { modalOpenRef.current = modalOpen; }, [modalOpen]);

  const baseVersionRef = useRef<number | null>(null);
  const [pendingReload, setPendingReload] = useState(false);
  const graceExpiredRef = useRef(false);

  // 버전 폴링: 5분 간격으로 /version.json 체크
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (!res.ok) return;
        const data = (await res.json()) as { v: number };
        if (baseVersionRef.current === null) {
          baseVersionRef.current = data.v; // 최초 로드 버전 기억
          return;
        }
        if (data.v !== baseVersionRef.current) {
          setPendingReload((prev) => {
            if (!prev) {
              // 최초 감지 시에만 토스트 (새로고침 버튼 포함, 자동 닫힘 없음)
              addToast('새 버전이 있습니다. 새로고침하시겠습니까?', 'info', {
                label: '새로고침',
                onClick: () => window.location.reload(),
              });
            }
            return true;
          });
        }
      } catch {
        // 네트워크 에러 무시
      }
    };

    check();
    const id = setInterval(check, POLL_MS);
    return () => clearInterval(id);
  }, [addToast]);

  // pendingReload가 true가 되면 30분 그레이스 타이머 시작
  // 타이머 만료 시 idle이면 즉시 새로고침, 아니면 다음 state 변화를 기다림
  useEffect(() => {
    if (!pendingReload) return;
    graceExpiredRef.current = false;
    const timer = setTimeout(() => {
      graceExpiredRef.current = true;
      if (isIdle(modalOpenRef.current)) window.location.reload();
    }, GRACE_MS);
    return () => clearTimeout(timer);
  }, [pendingReload]);

  // 방 이동 / 패널 닫힘 시 idle 체크 → 그레이스 만료 후면 자동 새로고침
  useEffect(() => {
    if (!pendingReload || !graceExpiredRef.current) return;
    if (isIdle(modalOpen)) window.location.reload();
  }, [pendingReload, modalOpen, currentRoom]);
}
