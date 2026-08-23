"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

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
  isCurved: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pathD?: string | undefined;
};

/**
 * SpectatorConnector วาดเส้น SVG เชื่อมคู่ไอออนผู้ชมที่ถูกตัดออก
 * - คำนวณพิกัดสัมพัทธ์ระหว่างการ์ดซ้ายและขวา
 * - ถ้าอยู่คนละบรรทัดจะวาด path โค้งอ้อม
 * - คำนวณใหม่เมื่อ pairs เปลี่ยน, ขนาดเปลี่ยน, หรือหมุนจอ ผ่าน requestAnimationFrame
 */
export function SpectatorConnector({
  containerRef,
  cardRefs,
  pairs,
  reducedMotion = false,
}: SpectatorConnectorProps) {
  const [lines, setLines] = useState<LineSegment[]>([]);
  const rafRef = useRef<number | null>(null);

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

        for (const pair of pairs) {
          const elLeft = cardsMap.get(pair.leftInstanceId);
          const elRight = cardsMap.get(pair.rightInstanceId);
          if (!elLeft || !elRight) continue;

          const rectLeft = elLeft.getBoundingClientRect();
          const rectRight = elRight.getBoundingClientRect();

          const x1 = rectLeft.left + rectLeft.width / 2 - containerRect.left;
          const y1 = rectLeft.top + rectLeft.height / 2 - containerRect.top;
          const x2 = rectRight.left + rectRight.width / 2 - containerRect.left;
          const y2 = rectRight.top + rectRight.height / 2 - containerRect.top;

          const isDifferentRow = Math.abs(rectLeft.top - rectRight.top) > rectLeft.height / 2;

          let pathD: string | undefined;
          if (isDifferentRow) {
            const dx = x2 - x1;
            const curveOffset = Math.min(60, Math.max(30, Math.abs(y2 - y1)));
            pathD = `M ${x1} ${y1} C ${x1 + dx / 4} ${y1 - curveOffset}, ${
              x2 - dx / 4
            } ${y2 - curveOffset}, ${x2} ${y2}`;
          }

          nextLines.push({
            key: `${pair.leftInstanceId}-${pair.rightInstanceId}`,
            isCurved: isDifferentRow,
            x1,
            y1,
            x2,
            y2,
            pathD,
          });
        }

        setLines(nextLines);
      });
    };

    updatePositions();

    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      resizeObserver = new ResizeObserver(() => {
        updatePositions();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", updatePositions);
    window.addEventListener("orientationchange", updatePositions);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("orientationchange", updatePositions);
    };
  }, [containerRef, cardRefs, pairs]);

  if (lines.length === 0) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
    >
      {lines.map((line) => {
        if (line.isCurved && line.pathD) {
          return (
            <path
              key={line.key}
              d={line.pathD}
              fill="none"
              stroke="#C63C45"
              strokeWidth={3}
              strokeLinecap="round"
              className={reducedMotion ? "" : "transition-all duration-200"}
            />
          );
        }
        return (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#C63C45"
            strokeWidth={3}
            strokeLinecap="round"
            className={reducedMotion ? "" : "transition-all duration-200"}
          />
        );
      })}
    </svg>
  );
}
