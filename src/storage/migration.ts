/**
 * กลไกอัปเกรดเซฟข้ามเวอร์ชัน
 *
 * ตอนนี้มีแค่ v1 จึงยังไม่มี migration ตัวจริงสักตัว — ไฟล์นี้สร้าง**กลไก**
 * ไว้รอ ไม่ได้เดา schema ของ v2 ล่วงหน้า เพราะยังไม่รู้ว่า v2 จะเปลี่ยนอะไร
 *
 * ตัว runner รับ map เข้ามาได้ ทำให้ทดสอบการไล่ chain ด้วย migration ปลอม
 * ได้จริงตั้งแต่วันนี้ โดยไม่ต้องประดิษฐ์เวอร์ชันอนาคตขึ้นมาลอย ๆ
 */

export const CURRENT_VERSION = 1;

/** แปลงเซฟจากเวอร์ชันหนึ่งไปเวอร์ชันถัดไป ต้องเป็นฟังก์ชันบริสุทธิ์ */
export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** key คือเวอร์ชันต้นทาง เช่น key 1 คือฟังก์ชันที่พา v1 ไป v2 */
export const MIGRATIONS: ReadonlyMap<number, Migration> = new Map();

export type MigrateResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: "not-an-object" | "bad-version" | "no-migration-path" };

/**
 * ไล่ migration จากเวอร์ชันของไฟล์ขึ้นมาจนถึงเวอร์ชันปัจจุบัน
 *
 * คืนผลเป็นค่า ไม่ throw เพราะไฟล์ที่อัปเกรดไม่ได้คือเรื่องปกติที่ต้องจัดการ
 * (เอาไปกักไว้แล้วเริ่มใหม่) ไม่ใช่ข้อผิดพลาดของโปรแกรม
 */
export type MigrateOptions = {
  migrations?: ReadonlyMap<number, Migration> | undefined;
  /**
   * เปิดให้ตั้งค่าได้เพื่อ**ทดสอบตัวไล่ chain ได้ตั้งแต่วันนี้**
   * ถ้าล็อกไว้ที่ CURRENT_VERSION = 1 ตายตัว ลูปจะไม่มีวันทำงานเลย
   * แล้วโค้ดส่วนนี้จะไม่เคยถูกทดสอบจนกว่าจะมี v2 จริง ซึ่งสายเกินไป
   */
  currentVersion?: number | undefined;
};

export function migrate(
  raw: unknown,
  options: MigrateOptions = {},
): MigrateResult {
  const migrations = options.migrations ?? MIGRATIONS;
  const currentVersion = options.currentVersion ?? CURRENT_VERSION;

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: "not-an-object" };
  }

  let current = { ...(raw as Record<string, unknown>) };
  const version = current["version"];

  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return { ok: false, reason: "bad-version" };
  }

  // เซฟจากเวอร์ชันใหม่กว่าโปรแกรม แปลงถอยหลังไม่ได้ และไม่ควรเดา
  if (version > currentVersion) {
    return { ok: false, reason: "bad-version" };
  }

  for (let from = version; from < currentVersion; from += 1) {
    const step = migrations.get(from);
    if (!step) {
      return { ok: false, reason: "no-migration-path" };
    }
    current = step(current);
  }

  return { ok: true, value: current };
}
