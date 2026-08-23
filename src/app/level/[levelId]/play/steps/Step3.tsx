"use client";

import type { BuiltLevel } from "../../../../../data/buildLevel";
import type { GameEvent } from "../../../../../domain/game/events";
import { isPrecipitateRevealed } from "../../../../../domain/game/selectors";
import type { GameState } from "../../../../../domain/game/types";
import { CompoundCard } from "../../../../../components/game/CompoundCard";
import { IonCard } from "../../../../../components/game/IonCard";
import { Button } from "../../../../../components/ui/Button";
import { DropletIcon, StarIcon } from "../../../../../components/ui/Icon";
import { compoundCardView, freeIonView } from "../../../../../presentation/cards";

export type Step3Props = {
  state: GameState;
  level: BuiltLevel;
  dispatch: (event: GameEvent) => void;
};

/**
 * ขั้นตรวจผลิตภัณฑ์ — กล่องซ้ายคือตะกอน กล่องขวาคือ**ไอออนอิสระ** ไม่ใช่สารประกอบ
 *
 * เอกสาร UI หน้า 09 วาดกล่องขวาเป็นการ์ดไอออนแยกสองใบ (Na⁺ กับ NO₃⁻) ไม่ใช่
 * การ์ด NaNO₃ ใบเดียว ซึ่งถูกต้องทางเคมีด้วย — สารที่ละลายน้ำไม่ได้เกิดขึ้นจริง
 * เป็นก้อน มันอยู่ในรูปไอออนอิสระเสมอ การวาดเป็นสูตรสารประกอบจะสอนผิดตรงข้าม
 * กับสิ่งที่ขั้นถัดไป (ตัดไอออนผู้ชม) กำลังจะให้ผู้เล่นทำพอดี
 *
 * ด้วยเหตุผลเดียวกัน คำว่า "ผลิตภัณฑ์" ใช้กับตะกอนเท่านั้นในหน้านี้
 */
export function Step3({ state, level, dispatch }: Step3Props) {
  const revealed = isPrecipitateRevealed(state);
  const precipitateView = compoundCardView(level.precipitate, { revealed });

  const aqueous = level.aqueousProduct;
  const freeIons = [
    freeIonView(aqueous.cationId, {
      count: aqueous.cationCount,
      phase: "aq",
      instanceId: `L${level.id}:aqion:cat`,
    }),
    freeIonView(aqueous.anionId, {
      count: aqueous.anionCount,
      phase: "aq",
      instanceId: `L${level.id}:aqion:an`,
    }),
  ];

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="text-xl font-bold text-navy">ขั้นที่ 3 · ตรวจสอบและสร้างผลิตภัณฑ์</h2>
        <p className="text-sm text-navy/70">
          ไอออนคู่ที่ไม่ละลายน้ำรวมกันเป็นตะกอน ส่วนไอออนที่เหลือยังคงแยกกันอยู่ในสารละลาย
        </p>
      </div>

      <div className="flex w-full flex-col items-stretch justify-center gap-4 sm:flex-row sm:gap-6">
        {/* กล่องซ้าย — ผลิตภัณฑ์ที่เป็นตะกอน */}
        <div className="flex flex-1 flex-col items-center gap-3 rounded-card border-2 border-gold bg-gold/10 p-4 shadow-card sm:min-w-[16rem] sm:max-w-sm sm:p-5">
          <div className="flex items-center gap-1.5 text-sm font-bold text-navy">
            <StarIcon className="text-gold" />
            <span>ผลิตภัณฑ์ที่เป็นตะกอน</span>
          </div>
          <CompoundCard view={precipitateView} />
          <span className="text-xs text-navy/70">สถานะของแข็ง (s) แยกตัวออกจากสารละลาย</span>
        </div>

        {/* กล่องขวา — ไอออนอิสระ แยกใบละไอออน ตามเอกสาร UI หน้า 09 */}
        <div className="flex flex-1 flex-col items-center gap-3 rounded-card border border-border bg-white p-4 shadow-card sm:min-w-[16rem] sm:max-w-sm sm:p-5">
          <div className="flex items-center gap-1.5 text-sm font-bold text-navy">
            <DropletIcon className="text-blue" />
            <span>ไอออนที่ยังคงอยู่ในสารละลาย</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {freeIons.map((ion) => (
              <IonCard key={ion.instanceId} view={ion} />
            ))}
          </div>
          <span className="text-xs text-navy/70">
            สถานะสารละลาย (aq) — ไม่รวมเป็นสารประกอบ ยังแยกกันอยู่เป็นไอออน
          </span>
        </div>
      </div>

      <Button variant="gold" onClick={() => dispatch({ type: "CONFIRM_PRODUCTS" })}>
        ไปขั้นตัดไอออนผู้ชม
      </Button>
    </div>
  );
}
