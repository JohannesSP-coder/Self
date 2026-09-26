import type { ReactNode } from "react";

interface IconProps {
  size?: number;
}

function Stroke({ size = 21, width = 1.8, children }: IconProps & { width?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9h12v-9" />
  </Stroke>
);

export const JournalIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5C4.7 20 4 19.3 4 18.5z" />
    <path d="M20 5.5C20 4.7 19.3 4 18.5 4H12v16h6.5c.8 0 1.5-.7 1.5-1.5z" />
  </Stroke>
);

export const ShieldIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z" />
  </Stroke>
);

export const ChatIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 12a8 8 0 1 1 3.1 6.3L4 20l1.2-3.6A8 8 0 0 1 4 12z" />
  </Stroke>
);

export const DumbbellIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 9v6" />
    <path d="M20 9v6" />
    <path d="M7 7v10" />
    <path d="M17 7v10" />
    <path d="M7 12h10" />
  </Stroke>
);

export const LeafIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z" />
    <path d="M5 19c2-4 5-7 9-9" />
  </Stroke>
);

export const MoonIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" />
  </Stroke>
);

export const StarIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </Stroke>
);

export const LockIcon = (p: IconProps) => (
  <Stroke width={1.9} {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Stroke>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M9 6l6 6-6 6" />
  </Stroke>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Stroke width={1.9} {...p}>
    <path d="M19 12H5" />
    <path d="M11 18l-6-6 6-6" />
  </Stroke>
);

export const ArrowUpIcon = (p: IconProps) => (
  <Stroke width={2} {...p}>
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </Stroke>
);

export const PlusIcon = (p: IconProps) => (
  <Stroke width={2.2} {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Stroke>
);

export const CheckIcon = (p: IconProps) => (
  <Stroke width={2.4} {...p}>
    <path d="M5 13l4 4 10-10" />
  </Stroke>
);

export const TrashIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 7h16" />
    <path d="M10 11v6M14 11v6" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M9 7V4h6v3" />
  </Stroke>
);

export const LogoutIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5" />
    <path d="M5 12h11" />
  </Stroke>
);

export const RingsIcon = (p: IconProps) => (
  <Stroke width={1.6} {...p}>
    <circle cx="9" cy="9" r="6" />
    <circle cx="15" cy="9" r="6" />
    <circle cx="12" cy="15" r="6" />
  </Stroke>
);

export const BatteryIcon = ({ size = 21 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="8" width="15" height="10" rx="2.5" />
    <rect x="19" y="11" width="2" height="4" rx="0.5" fill="currentColor" stroke="none" />
    <path d="M11 10.5 8.5 14H11l-1 3.5 3.5-4.5H11z" fill="currentColor" stroke="none" />
  </svg>
);

export const ChartIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="4" y="14" width="4" height="6" rx="1" />
    <rect x="10" y="8" width="4" height="12" rx="1" />
    <rect x="16" y="3" width="4" height="17" rx="1" />
  </svg>
);

export const FlameIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C9 6 6 8.5 6 13.5a6 6 0 0 0 12 0c0-2.3-1-4.3-2.6-5.8.2 1.9-.6 3.4-2 4 .8-3.3-.2-6.8-1.4-9.7z" />
  </svg>
);

export const SendIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4 12l16-8-6 16-2-7z" />
  </svg>
);

export const SEGMENT_ICONS: Record<string, { label: string; Icon: (p: IconProps) => ReactNode }> = {
  dumbbell: { label: "Fitness", Icon: DumbbellIcon },
  leaf: { label: "Mindset", Icon: LeafIcon },
  moon: { label: "Schlaf", Icon: MoonIcon },
  chart: { label: "Finanzen", Icon: ChartIcon },
  star: { label: "Sonstiges", Icon: StarIcon },
};

export function SegmentIcon({ icon, size }: { icon: string | null; size?: number }) {
  const { Icon } = SEGMENT_ICONS[icon ?? ""] ?? SEGMENT_ICONS.star;
  return <Icon size={size} />;
}
