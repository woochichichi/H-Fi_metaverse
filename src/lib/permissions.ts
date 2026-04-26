/**
 * v2 권한 헬퍼
 *
 * 4단계 역할별 권한 정책:
 *
 *                              member  leader  director  admin
 *   사이드바 관리 섹션 노출        ✗       ✓       ✓        ✓
 *   전사 데이터 조회               ✗       ✗       ✓        ✓
 *   실명 조회                      ✗       ✗       ✓        ✓
 *   초대 코드 / 차단 로그          ✗       ✗       ✗        ✓
 *   사용자/평가 관리 (자기 팀)     ✗       ✓       ✓        ✓
 *   VOC/아이디어 상태 변경         ✗       ✓       ✓        ✓
 *   익명 쪽지 수신/답변            ✗       ✓       ✓        ✓
 *
 * 핵심 차이:
 * - **director vs admin**: director 는 admin 의 모든 데이터 권한을 가지지만
 *   초대 코드 / 차단 로그(시스템 운영) 는 admin 만. 즉 director 는 "조직 운영자",
 *   admin 은 "시스템 관리자".
 * - **leader vs director**: 둘 다 관리 섹션 보지만 leader 는 자기 팀(profile.team)
 *   으로 자동 필터, director 는 전사.
 * - **leader vs member**: member 는 관리 섹션 자체 비노출.
 *
 * 이 헬퍼는 UI 가드용이며, 실제 데이터 접근은 기존 RLS가 최종 방어선이다.
 */

import type { Profile } from '../types/database';
import type { Role } from './constants';

export interface Permissions {
  role: Role | null;
  team: string | null;
  /** admin OR director — 기존 코드베이스의 isAdmin 취급과 동일 */
  isAdmin: boolean;
  /** admin OR director OR leader — 기존 isLeader 취급과 동일 */
  isLeader: boolean;
  /** leader인지 (admin/director 아님) */
  isLeaderOnly: boolean;
  /** 순수 admin만 (director 제외) */
  isSuperAdmin: boolean;
  /** 실명 조회 가능 여부 — getDisplayName(profile, isAdmin) 인자와 동일 */
  canSeeRealName: boolean;
  /** 전사 데이터 조회 가능 (admin/director) */
  canSeeAllTeams: boolean;
  /** 관리 섹션 사이드바 노출 */
  showAdminSection: boolean;
  /** 초대 코드 접근 가능 (admin만) */
  canManageInvites: boolean;
  /** 차단 로그 접근 가능 (admin만) */
  canSeeModLogs: boolean;
  /** VOC 처리 권한 */
  canProcessVoc: boolean;
  /** 아이디어 상태 변경 */
  canChangeIdeaStatus: boolean;
  /** 공지 작성 (urgency=긴급 포함) */
  canWriteNotice: boolean;
  /** KPI 입력 */
  canInputKpi: boolean;
  /** 익명 쪽지 수신/답변 */
  canReceiveAnonNotes: boolean;
  /** 평가 대시보드 접근 */
  canAccessEvalDashboard: boolean;
  /** 사용자 관리 접근 */
  canManageUsers: boolean;
  /** 커스텀 평가 항목 */
  canManageEvalItems: boolean;
}

export function getPermissions(profile: Profile | null): Permissions {
  const role = profile?.role ?? null;
  const team = profile?.team ?? null;

  const isAdmin = role === 'admin' || role === 'director';
  const isLeader = isAdmin || role === 'leader';
  const isLeaderOnly = role === 'leader';
  const isSuperAdmin = role === 'admin';

  return {
    role,
    team,
    isAdmin,
    isLeader,
    isLeaderOnly,
    isSuperAdmin,
    canSeeRealName: isAdmin,
    canSeeAllTeams: isAdmin,
    showAdminSection: isLeader,
    canManageInvites: isSuperAdmin,
    canSeeModLogs: isSuperAdmin,
    canProcessVoc: isLeader,
    canChangeIdeaStatus: isLeader,
    canWriteNotice: isLeader,
    canInputKpi: isLeader,
    canReceiveAnonNotes: isLeader,
    canAccessEvalDashboard: isLeader,
    canManageUsers: isLeader,
    canManageEvalItems: isLeader,
  };
}
