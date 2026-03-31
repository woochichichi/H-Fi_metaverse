import { ChevronDown, UserX } from 'lucide-react';
import { getDisplayName } from '../../lib/utils';
import type { Profile } from '../../types';

interface UserRowProps {
  user: Profile;
  isAdmin: boolean;
  isLeader: boolean;
  isSelf: boolean;
  onRoleChange: (userId: string, user: Profile, newRole: string) => void;
  onStatusToggle: (userId: string, user: Profile) => void;
  onResign: (userId: string, user: Profile) => void;
}

export default function UserRow({ user: u, isAdmin, isLeader, isSelf, onRoleChange, onStatusToggle, onResign }: UserRowProps) {
  const canResign = !isSelf && (isAdmin || (isLeader && u.role === 'member'));

  return (
    <tr className={`border-b border-white/[.04] transition-colors hover:bg-white/[.02] ${u.status === '퇴사' ? 'opacity-50' : ''}`}>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
            style={{ backgroundColor: u.avatar_color }}
          >
            {u.avatar_emoji}
          </div>
          <span className="text-text-primary">{getDisplayName(u, true)}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-text-secondary">{u.team}</td>
      {isAdmin && (
        <td className="px-3 py-2 text-center">
          <div className="relative inline-block">
            <select
              value={u.role}
              onChange={(e) => onRoleChange(u.id, u, e.target.value)}
              disabled={u.status === '퇴사'}
              className="appearance-none rounded-md border border-white/[.1] bg-bg-primary px-2 py-0.5 pr-5 text-[11px] text-text-primary disabled:opacity-40"
            >
              <option value="member">멤버</option>
              <option value="leader">리더</option>
              <option value="director">금융담당</option>
              <option value="admin">관리자</option>
            </select>
            <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
        </td>
      )}
      <td className="px-3 py-2 text-text-muted">
        {new Date(u.created_at).toLocaleDateString('ko-KR')}
      </td>
      <td className="px-3 py-2 text-center">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
            u.status === '퇴사'
              ? 'bg-danger/20 text-danger'
              : u.status === 'online'
                ? 'bg-success/20 text-success'
                : u.status === '재택'
                  ? 'bg-info/20 text-info'
                  : 'bg-white/[.08] text-text-muted'
          }`}
        >
          {u.status}
        </span>
      </td>
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          {isAdmin && u.status !== '퇴사' && (
            <button
              onClick={() => onStatusToggle(u.id, u)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                u.status === 'offline'
                  ? 'bg-success/10 text-success hover:bg-success/20'
                  : 'bg-danger/10 text-danger hover:bg-danger/20'
              }`}
            >
              {u.status === 'offline' ? '활성화' : '비활성화'}
            </button>
          )}
          {canResign && (
            <button
              onClick={() => onResign(u.id, u)}
              className={`flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                u.status === '퇴사'
                  ? 'bg-success/10 text-success hover:bg-success/20'
                  : 'bg-danger/10 text-danger hover:bg-danger/20'
              }`}
            >
              <UserX size={10} />
              {u.status === '퇴사' ? '복원' : '퇴사'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
