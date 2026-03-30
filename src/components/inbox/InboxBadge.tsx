interface InboxBadgeProps {
  count: number;
}

export default function InboxBadge({ count }: InboxBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
