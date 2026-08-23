import type { SVGProps } from "react";

/**
 * ชุดไอคอน SVG ของทั้งเกม — **ห้ามใช้อิโมจิเป็นไอคอนที่ไหนอีก**
 *
 * เหตุผลที่ไม่ใช้อิโมจิ:
 * 1. หน้าตาต่างกันคนละระบบปฏิบัติการ (iPadOS / Windows / Android) คุมดีไซน์ไม่ได้
 * 2. screen reader อ่านชื่ออิโมจิออกมาเป็นคำที่ไม่เกี่ยวกับบริบท เช่น "หยดน้ำ"
 * 3. ปรับสีตามโทเค็นไม่ได้ ทำให้ contrast ตรวจไม่ผ่านในบางสถานะ
 *
 * ทุกไอคอนเป็น `aria-hidden` เสมอ — ความหมายต้องมาจากข้อความข้าง ๆ หรือ
 * `aria-label` ของปุ่มที่ห่อมันอยู่ ไม่ใช่จากตัวไอคอนเอง
 */

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children" | "viewBox">;

function base(props: IconProps) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
    focusable: "false" as const,
    ...props,
    className: `inline-block h-[1em] w-[1em] shrink-0 ${props.className ?? ""}`,
  };
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="10" width="16" height="11" rx="2" fill="currentColor" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" {...STROKE} />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m4 12.5 5.5 5.5L20 6.5" {...STROKE} />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" />
      <path
        d="m7.5 12.5 3 3 6-6.5"
        fill="none"
        stroke="var(--color-panel, #fff)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="m12 3.6 2.6 5.5 5.9.8-4.3 4.2 1 6-5.2-2.8L6.8 20l1-6-4.3-4.2 5.9-.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function StarOutlineIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="m12 3.6 2.6 5.5 5.9.8-4.3 4.2 1 6-5.2-2.8L6.8 20l1-6-4.3-4.2 5.9-.8z"
        {...STROKE}
      />
    </svg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 21.5 20H2.5z" fill="currentColor" />
      <path
        d="M12 9.5v4.2"
        stroke="var(--color-panel, #fff)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.8" r="1.1" fill="var(--color-panel, #fff)" />
    </svg>
  );
}

export function HintIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 17.5h6M10 21h4" {...STROKE} />
      <path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.6v.6h6v-.6c0-.6.3-1.2.8-1.6A6.5 6.5 0 0 0 12 2.5Z" {...STROKE} />
    </svg>
  );
}

export function DropletIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3s6 6.4 6 10.4a6 6 0 0 1-12 0C6 9.4 12 3 12 3Z" fill="currentColor" />
    </svg>
  );
}

export function FlaskIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 3h4M11 3v6.2L5.4 18a2 2 0 0 0 1.7 3h9.8a2 2 0 0 0 1.7-3L13 9.2V3" {...STROKE} />
      <path d="M7.7 14h8.6" {...STROKE} />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4.5h6a3 3 0 0 1 3 3V21a2.5 2.5 0 0 0-2.5-2.5H4Z" {...STROKE} />
      <path d="M20 4.5h-6a3 3 0 0 0-3 3V21a2.5 2.5 0 0 1 2.5-2.5H20Z" {...STROKE} />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" {...STROKE} />
      <circle cx="4.5" cy="6.5" r="1.4" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.4" fill="currentColor" />
      <circle cx="4.5" cy="17.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 6 12 12M18 6 6 18" {...STROKE} />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...STROKE} />
      <path d="M10 11v6M14 11v6" {...STROKE} />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="9" width="11" height="12" rx="2" {...STROKE} />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" {...STROKE} />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5v11m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" {...STROKE} />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 15.5v-11m0 0 4 4m-4-4-4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" {...STROKE} />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="currentColor" />
      <path d="M7 5.5H4.5v1A3.5 3.5 0 0 0 8 10M17 5.5h2.5v1A3.5 3.5 0 0 1 16 10" {...STROKE} />
      <path d="M12 14v3.5M8.5 21h7l-.7-3.5h-5.6z" {...STROKE} />
    </svg>
  );
}

export function MouseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="7" y="2.8" width="10" height="18.4" rx="5" {...STROKE} />
      <path d="M12 6.5v3.5" {...STROKE} />
    </svg>
  );
}

export function TapIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 11.5V6a1.8 1.8 0 0 1 3.6 0v5.2" {...STROKE} />
      <path d="M12.6 11.2V9.6a1.7 1.7 0 0 1 3.4 0v1.8M16 11.6v-.8a1.7 1.7 0 0 1 3.4 0v5.4a5 5 0 0 1-5 5h-2a4.5 4.5 0 0 1-3.4-1.6L5.6 16a1.7 1.7 0 0 1 2.5-2.3L9 14.6" {...STROKE} />
    </svg>
  );
}

export function KeyboardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" {...STROKE} />
      <path d="M6.5 9.5h.01M10 9.5h.01M13.5 9.5h.01M17 9.5h.01M8 15h8" {...STROKE} />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" {...STROKE} />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        {...STROKE}
      />
    </svg>
  );
}

export function RotateDeviceIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="8.5" y="2.5" width="7" height="12" rx="1.6" {...STROKE} />
      <path d="M4.5 12.5A7.5 7.5 0 0 0 12 20h1.5" {...STROKE} />
      <path d="m11 17.6 2.6 2.4-2.6 2.4" {...STROKE} />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3 9.5 9-7 9 7v10a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5z" {...STROKE} />
      <path d="M9 21V12h6v9" {...STROKE} />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m15 18-6-6 6-6" {...STROKE} />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m9 18 6-6-6-6" {...STROKE} />
    </svg>
  );
}

