/**
 * ตัวจับจังหวะบันทึกอัตโนมัติ — ไม่ผูกกับ React
 *
 * ข้อ 3.4 ของแผนกำหนดจังหวะไว้ว่าบางเหตุการณ์ต้องบันทึกทันที บางเหตุการณ์
 * หน่วงได้ 300-500 ms ตรรกะการหน่วงนั้นไม่ต้องพึ่งเฟรมเวิร์กเลย จึงแยกออกมา
 * ทดสอบด้วยนาฬิกาปลอมได้ ส่วนการต่อสายกับ visibilitychange และการออกจาก
 * route เป็นงานของชั้น UI ใน Phase 7
 */

export type AutosaveScheduler = {
  /** ขอให้บันทึกแบบหน่วง รวมหลายครั้งติดกันเป็นครั้งเดียว */
  schedule(): void;
  /** บันทึกเดี๋ยวนี้ถ้ามีงานค้าง ใช้ตอนออกจากหน้าหรือแท็บถูกซ่อน */
  flushNow(): void;
  /** เลิกใช้ — ต้อง flush งานที่ค้างไว้ก่อนเสมอ */
  dispose(): void;
};

export type AutosaveOptions = {
  save: () => void;
  /** ค่าเริ่มต้น 400 ms อยู่กลางช่วง 300-500 ที่สเปกกำหนด */
  delayMs?: number | undefined;
  setTimeoutFn?: ((handler: () => void, timeout: number) => number) | undefined;
  clearTimeoutFn?: ((handle: number) => void) | undefined;
};

export const DEFAULT_AUTOSAVE_DELAY_MS = 400;

export function createAutosaveScheduler(
  options: AutosaveOptions,
): AutosaveScheduler {
  const delayMs = options.delayMs ?? DEFAULT_AUTOSAVE_DELAY_MS;
  const setTimeoutFn =
    options.setTimeoutFn ??
    ((handler, timeout): number =>
      setTimeout(handler, timeout) as unknown as number);
  const clearTimeoutFn =
    options.clearTimeoutFn ?? ((handle): void => { clearTimeout(handle); });

  let handle: number | null = null;
  let pending = false;
  let disposed = false;

  function cancelTimer(): void {
    if (handle !== null) {
      clearTimeoutFn(handle);
      handle = null;
    }
  }

  function run(): void {
    cancelTimer();
    if (!pending) return;
    pending = false;
    options.save();
  }

  return {
    schedule(): void {
      if (disposed) return;
      pending = true;
      cancelTimer();
      handle = setTimeoutFn(run, delayMs);
    },

    flushNow(): void {
      if (disposed) return;
      run();
    },

    /**
     * flush ก่อนเลิกเสมอ — กับดักที่แผนเตือนไว้ตรง ๆ คือผู้เล่นกดออกภายใน
     * 500 ms หลังแก้คำตอบ ถ้า dispose แล้วทิ้งงานค้าง ข้อมูลรอบนั้นหายทันที
     */
    dispose(): void {
      if (disposed) return;
      run();
      disposed = true;
    },
  };
}
