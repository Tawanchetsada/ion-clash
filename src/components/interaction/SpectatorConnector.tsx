"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

export type ConnectorPair = {
  leftInstanceId: string;
  rightInstanceId: string;
};

export type SpectatorConnectorProps = {
  containerRef: RefObject<HTMLElement | null>;
  /** map จาก instanceId ไป element ของการ์ด */
  cardRefs: RefObject<Map<string, HTMLElement>>;
  pairs: readonly ConnectorPair[];
  reducedMotion?: boolean | undefined;
};

type LineSegment = {
  key: string;
  pathD: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

/**
 * เส้นเชื่อมคู่ไอออนผู้ชมที่ถูกตัดออก — วาดเป็น SVG ทับแถบสมการ
 *
 * **เส้นต้องอ้อมขึ้นบนหรือลงล่างเสมอ ห้ามลากตรงผ่ากลางแถว** เพราะการ์ดของคู่
 * ที่ตัดกันอยู่คนละฝั่งของลูกศร เส้นตรงจะพาดทับการ์ดอื่นทุกใบที่ขวางอยู่ระหว่างทาง
 * (รวมทั้งตะกอนซึ่งห้ามตัด) จนดูเหมือนตัดไปทั้งสมการ — เอกสาร UI หน้า 10 วาดเป็น
 * เส้นอ้อมออกนอกแถวไว้ชัดเจนด้วยเหตุผลนี้
 *
 * คู่เลขคู่อ้อมด้านบน คู่เลขคี่อ้อมด้านล่าง สลับกันไป และยิ่งคู่หลังยิ่งอ้อมไกลขึ้น
 * เพื่อไม่ให้เส้นสองเส้นทับกันจนแยกไม่ออกว่าคู่ไหนเชื่อมกับคู่ไหน
 *
 * คำนวณใหม่เมื่อ pairs เปลี่ยน ขนาดเปลี่ยน แถบถูกเลื่อน หรือหมุนจอ — ทั้งหมด
 * ห่อด้วย requestAnimationFrame และยกเลิกเฟรมเก่าก่อนตั้งใหม่เสมอ
 */
export function SpectatorConnector({
  containerRef,
  cardRefs,
  pairs,
  reducedMotion = false,
}: SpectatorConnectorProps) {
  const [lines, setLines] = useState<LineSegment[]>([]);
  const rafRef = useRef<number | null>(null);

  // ผูก effect กับ "เนื้อหา" ของคู่ที่ตัด ไม่ใช่ identity ของ array — ผู้เรียก
  // สร้าง array ใหม่ทุก render อยู่แล้ว ถ้าผูกกับ identity effect จะรื้อ
  // ResizeObserver ทิ้งแล้วสร้างใหม่ทุกครั้งที่หน้า re-render โดยไม่จำเป็น
  const pairsKey = pairs.map((p) => `${p.leftInstanceId}|${p.rightInstanceId}`).join(",");
  const stablePairs = useMemo(() => pairs, [pairsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const updatePositions = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const container = containerRef.current;
        const cardsMap = cardRefs.current;
        if (!container || !cardsMap) return;

        const containerRect = container.getBoundingClientRect();
        const nextLines: LineSegment[] = [];

        stablePairs.forEach((pair, index) => {
          const elLeft = cardsMap.get(pair.leftInstanceId);
          const elRight = cardsMap.get(pair.rightInstanceId);
          if (!elLeft || !elRight) return;

          const rectLeft = elLeft.getBoundingClientRect();
          const rectRight = elRight.getBoundingClientRect();

          const above = index % 2 === 0;
          const lane = Math.floor(index / 2);

          const anchorY = (rect: DOMRect) =>
            (above ? rect.top : rect.bottom) - containerRect.top;

          const x1 = rectLeft.left + rectLeft.width / 2 - containerRect.left;
          const y1 = anchorY(rectLeft);
          const x2 = rectRight.left + rectRight.width / 2 - containerRect.left;
          const y2 = anchorY(rectRight);

          // การ์ดขึ้นบรรทัดใหม่บนจอแคบ — ต้องอ้อมไกลกว่าปกติไม่งั้นเส้นจะพาด
          // ทับแถวที่คั่นอยู่ตรงกลาง
          const rowGap = Math.abs(rectLeft.top - rectRight.top);
          const wrapped = rowGap > rectLeft.height / 2;

          const reach = (wrapped ? 34 : 18) + lane * 12 + (wrapped ? rowGap / 2 : 0);
          const controlY1 = y1 + (above ? -reach : reach);
          const controlY2 = y2 + (above ? -reach : reach);

          nextLines.push({
            key: `${pair.leftInstanceId}-${pair.rightInstanceId}`,
            pathD: `M ${x1} ${y1} C ${x1} ${controlY1}, ${x2} ${controlY2}, ${x2} ${y2}`,
            x1,
            y1,
            x2,
            y2,
          });
        });

        // เทียบกับของเดิมก่อนเซ็ต — ถ้าไม่เทียบ จะได้ array ใหม่ทุกครั้งที่
        // rAF ทำงาน ทำให้ re-render แล้ว effect ทำงานใหม่แล้วนัด rAF ใหม่วนไป
        // ไม่รู้จบ ทั้งที่พิกัดไม่ได้ขยับสักนิด (กิน CPU ตลอดเวลาบน iPad)
        setLines((prev) =>
          prev.length === nextLines.length &&
          prev.every((line, i) => line.key === nextLines[i]?.key && line.pathD === nextLines[i]?.pathD)
            ? prev
            : nextLines,
        );
      });
    };

    updatePositions();

    const container = containerRef.current;
    const scroller = container?.parentElement ?? null;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      resizeObserver = new ResizeObserver(() => {
        updatePositions();
      });
      resizeObserver.observe(container);
    }

    scroller?.addEventListener("scroll", updatePositions, { passive: true });
    window.addEventListener("resize", updatePositions);
    window.addEventListener("orientationchange", updatePositions);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      scroller?.removeEventListener("scroll", updatePositions);
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("orientationchange", updatePositions);
    };
  }, [containerRef, cardRefs, stablePairs]);

  if (lines.length === 0) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
    >
      {lines.map((line) => (
        <g
          key={line.key}
          className={reducedMotion ? "" : "transition-all duration-200"}
        >
          <path
            d={line.pathD}
            fill="none"
            stroke="var(--color-error)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <circle cx={line.x1} cy={line.y1} r={3.5} fill="var(--color-error)" />
          <circle cx={line.x2} cy={line.y2} r={3.5} fill="var(--color-error)" />
        </g>
      ))}
    </svg>
  );
}
