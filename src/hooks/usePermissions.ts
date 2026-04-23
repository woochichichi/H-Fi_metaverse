import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getPermissions, type Permissions } from '../lib/permissions';

/** 현재 로그인 사용자의 권한 집합. authStore.profile을 기준으로 동기적으로 계산. */
export function usePermissions(): Permissions {
  const profile = useAuthStore((s) => s.profile);
  return useMemo(() => getPermissions(profile), [profile]);
}
