import type { ErrorCode } from "../domain/chemistry/types";
import type { Difficulty } from "../data/levelSeeds";
import type { LevelStatus } from "../presentation/levels";

/**
 * รวมข้อความภาษาไทยทั้งหมดของระบบไว้ที่เดียว
 *
 * กติกา:
 * 1. ข้อความ error ทุกรหัสต้องบอกหลักการที่ผิด ห้ามบอกคำตอบหรือสูตรผลิตภัณฑ์ (ข้อห้ามใน CLAUDE.md)
 * 2. aria-label ของไอออนและชื่อไทยของสารประกอบสร้างจาก speech.ts จึงไม่ต้องย้ายมาที่นี่
 * 3. component ต้องดึงข้อความจากที่นี่หรือรับผ่าน prop เท่านั้น
 */
export const MESSAGES = {
  error: {
    "E-CHARGE": "ประจุรวมของสารประกอบยังไม่เป็นศูนย์ ลองปรับจำนวนไอออน",
    // ครอบทั้งสามกรณีที่ validateProductPairing คืน E-PAIR คือ ชุดไอออนไม่ครบ
    // · วางสลับลำดับ · จับคู่ไอออนจากสารตั้งต้นตัวเดียวกัน จึงต้องพูดถึง
    // "หลักการ" ทั้งสามข้อ ไม่ใช่บอกว่าจับคู่ผิด ซึ่งทำให้ผู้เล่นที่จับคู่ถูกแล้ว
    // แต่วางสลับช่องเข้าใจว่าตัวเองคิดเคมีผิด
    "E-PAIR": "ยังไม่ถูกต้อง — แต่ละคู่ต้องมีไอออนบวกอยู่ช่องหน้า ไอออนลบอยู่ช่องหลัง และไอออนสองตัวในคู่ต้องมาจากสารตั้งต้นคนละชนิด",
    "E-PHASE": "ตรวจสอบกฎการละลายของผลิตภัณฑ์อีกครั้ง",
    "E-BALANCE": "จำนวนอะตอมบางธาตุยังไม่เท่ากันทั้งสองข้าง",
    "E-RATIO": "สมการสมดุลแล้ว แต่ยังลดสัมประสิทธิ์ได้",
    "E-SPECTATOR": "ตัดได้เฉพาะไอออนที่เหมือนกันและไม่เปลี่ยนแปลงทั้งสองข้าง",
  } satisfies Readonly<Record<ErrorCode, string>>,

  success: {
    arrangement: "จับคู่ถูกต้อง",
    balance: "สมการสมดุลแล้ว",
    products: "ผลิตภัณฑ์ผ่านการตรวจครบทุกข้อ",
    cancelPair: "ตัดไอออนผู้ชมคู่นี้ถูกต้อง",
    cancelComplete: "ตัดไอออนผู้ชมครบแล้ว",
    levelComplete: "ถูกต้อง! สมการไอออนิกสุทธิสมบูรณ์",
  } as const,

  save: {
    idle: "พร้อมบันทึก",
    saving: "กำลังบันทึก…",
    saved: "บันทึกแล้ว",
    error: "บันทึกไม่สำเร็จ",
    retry: "ลองบันทึกอีกครั้ง",
    export: "ส่งออกข้อมูล",
  } as const,

  toast: {
    unlocked: (lvl: number | string) => `ผ่านด่าน ${lvl} ก่อนเพื่อปลดล็อกด่านนี้`,
    importSuccess: "นำเข้าข้อมูลความก้าวหน้าเรียบร้อยแล้ว",
    importError: "ไฟล์ข้อมูลไม่ถูกต้อง ไม่สามารถนำเข้าได้",
    exportSuccess: "คัดลอกข้อมูลความก้าวหน้าลงคลิปบอร์ดแล้ว",
    resetSuccess: "รีเซ็ตข้อมูลความก้าวหน้าทั้งหมดแล้ว",
  } as const,

  ui: {
    gameSubtitle: "บอร์ดแม่เหล็กสมการไอออนิก",
    home: "หน้าแรก",
    howToPlay: "วิธีเล่น",
    levels: "เลือกด่าน",
    levelOverview: "ภาพรวมด่าน",
    settings: "ตั้งค่า",
    progress: "ความก้าวหน้า",
    knowledge: "คลังความรู้",
    rules: "ดูกฎการละลาย",
    retry: "ลองใหม่",
    nextLevel: "ด่านถัดไป",
    replay: "เล่นซ้ำ",
    play: "เริ่มเล่นเลย",
    backToLevels: "กลับหน้าเลือกด่าน",
    mainNav: "เมนูหลัก",
    levelPrefix: "ด่าน",
    starsSuffix: "ดาว",
    prevStep: "ย้อนกลับ",
    stepBackTo: (step: number, name: string) => `ย้อนกลับไปขั้นที่ ${step}: ${name}`,
    backToStep1: "ย้อนกลับไปขั้นที่ 1",
    backToArrangement: "ย้อนกลับไปจัดเรียงไอออน",
    backToStep2: "ย้อนกลับไปขั้นที่ 2",
    backToStep3: "ย้อนกลับไปขั้นที่ 3",
    backToStep4: "ย้อนกลับไปขั้นที่ 4",
    clearAllSlots: "ล้างทุกช่อง",
    checkArrangement: "ตรวจการจัดเรียงไอออน",
    checkBalance: "ตรวจการดุลสมการ",
    goToSpectatorStep: "ไปขั้นตัดไอออนผู้ชม",
    undoPair: "ย้อนคู่ล่าสุด (UNDO)",
    resetAllCuts: "ล้างการตัดทั้งหมด (RESET)",
    confirmCancellation: "ยืนยันการตัดไอออน",
    completeAndScore: "ดูผลคะแนนและจบด่าน",
    hintButton: (remaining: number) => `คำใบ้ (เหลือ ${remaining} ครั้ง)`,
    hintTitle: (index: number) => `คำใบ้ที่ ${index}:`,
    prevHint: "คำใบ้ก่อนหน้า",
    nextHint: "คำใบ้ถัดไป",
    hintPagination: (current: number, total: number) => `คำใบ้ที่ ${current} จาก ${total}`,
    cutPairEmpty: "ยังไม่ได้ตัดไอออนผู้ชมคู่ใด",
    cutPairListLabel: "รายการไอออนผู้ชมที่ตัดแล้ว",
    equationRegionLabel: "สมการไอออนิก",
    struckSuffix: "ถูกตัดออกแล้ว",
    stepProgressLabel: "ความคืบหน้าของด่าน",
    stepCurrentSuffix: " (ขั้นปัจจุบัน)",
    stepDoneSuffix: " (ผ่านแล้ว)",
    coefficientLabelPrefix: "สัมประสิทธิ์หน้า",
    slotEmptySuffix: "ว่าง",
    removeSlotPrefix: "นำออกจาก",
    box21Title: "แลกเปลี่ยนคู่ไอออนสร้างผลิตภัณฑ์",
    box22Title: "เขียนสูตรสารประกอบไอออนิก (คูณไขว้)",
    box23Title: "ดุลสมการเคมี",
    box21Done: "จัดเรียงไอออนถูกต้องแล้ว",
    crissCrossTitle: "เขียนสูตรสารประกอบไอออนิก (คูณไขว้)",
    crissCrossDesc:
      "ตัวเลขประจุไอออนบวกกลายเป็นตัวห้อยของไอออนลบ และประจุไอออนลบกลายเป็นตัวห้อยของไอออนบวก",
    crissCrossPrecipLabel: "ผลิตภัณฑ์ที่เป็นตะกอน (s)",
    crissCrossAqLabel: "ไอออนที่ยังคงอยู่ในสารละลาย (aq)",
    goToBalance: "ถัดไป: 2.3 ดุลสมการเคมี",
    backToCrissCross: "ย้อนกลับไปดูการคูณไขว้ (2.2)",
    atomTableTitle: "ตรวจนับจำนวนอะตอม/ไอออน",
    atomTableIon: "ไอออน/ธาตุ",
    atomTableLeft: "ฝั่งซ้าย",
    atomTableRight: "ฝั่งขวา",
    atomTableBalanced: "สมดุล",
    atomTableNotBalanced: "ยังไม่สมดุล",
    atomTableEmpty: "—",
    steps: [
      "เข้าสู่เกม",
      "ไอออน 4 ไป 4",
      "ตรวจผลิตภัณฑ์",
      "ตัดไอออนผู้ชม",
      "สมการไอออนิกสุทธิ",
    ] as const,
    difficulty: {
      easy: "ง่าย",
      basic: "พื้นฐาน",
      medium: "ปานกลาง",
      hard: "ยาก",
      challenge: "ท้าทาย",
    } satisfies Readonly<Record<Difficulty, string>>,
    levelStatus: {
      completed: "ผ่านแล้ว",
      current: "ด่านปัจจุบัน",
      locked: "ยังไม่ปลดล็อก",
    } satisfies Readonly<Record<LevelStatus, string>>,
    exitDialog: {
      title: "ออกจากด่านหรือไม่?",
      description: "ระบบได้บันทึกความก้าวหน้าล่าสุดไว้แล้ว คุณสามารถกลับมาเล่นต่อจากจุดเดิมได้ในภายหลัง",
      confirm: "ออกจากด่าน",
      cancel: "เล่นต่อ",
    },
    nameDialog: {
      title: "ยินดีต้อนรับสู่ Ion Clash",
      description: "กรุณาระบุชื่อเล่นหรือรหัสนักเรียน เพื่อบันทึกความก้าวหน้าในการเรียนรู้",
      placeholder: "ชื่อเล่นหรือรหัสนักเรียน",
      submit: "เริ่มเรียนรู้",
    },
    problemLabel: "โจทย์",
    problemUnknown: "ผลิตภัณฑ์ที่ต้องหาคำตอบ",
    dismissFeedback: "ปิดการแจ้งเตือน",
    close: "ปิด",
    rotatePrompt: {
      title: "หมุนเครื่องเป็นแนวนอน",
      description:
        "สมการจะอยู่ในบรรทัดเดียวทั้งเส้น ทำให้เห็นได้พร้อมกันว่าอะไรอยู่หน้าลูกศรและอะไรอยู่หลัง อ่านง่ายกว่าและลากไอออนสะดวกกว่ามาก",
      dismiss: "เล่นแนวตั้งต่อไป",
    },
    rulesDialog: {
      instruction:
        "วิธีใช้: ตรวจสอบไอออนในสารประกอบตามลำดับจากข้อ 1 ลงไป ละลายน้ำให้ใช้สถานะ (aq) ส่วนสารที่เกิดตะกอนให้ใช้สถานะ (s)",
      tip: "ลำดับของกฎมีความสำคัญ: หากตรงกับหลายข้อ ให้ใช้กฎข้อบนสุดเป็นหลักในการตัดสิน",
      note: "หมายเหตุ: หากสารประกอบตรงกับกฎหลายข้อ ให้ตรวจตามลำดับจากข้อ 1 ลงมา และใช้กฎข้อแรกที่ตรงกับสารประกอบนั้น",
      summaryTitle: "จำให้แม่น",
      alwaysSolubleLabel: "ละลายน้ำเสมอ:",
      alwaysSolubleIons: "Na⁺, K⁺, NH₄⁺ และ NO₃⁻",
      mostlySolubleLabel: "ปกติละลาย แต่ต้องตรวจข้อยกเว้น:",
      mostlySolubleIons: "Cl⁻, Br⁻, I⁻, SO₄²⁻ และ SCN⁻",
      mostlyInsolubleLabel: "ปกติเกิดตะกอน แต่ต้องตรวจข้อยกเว้น:",
      mostlyInsolubleIons: "OH⁻, CO₃²⁻, PO₄³⁻ และ S²⁻",
      colOrder: "#",
      colRule: "กฎการละลาย",
      colOutcome: "ผลลัพธ์",
      close: "ปิด",
      outcomeSoluble: "ละลาย (aq)",
      outcomePrecipitate: "ตะกอน (s)",
      status: "สถานะ:",
      statusNormal: "สถานะปกติ:",
      statusException: "สถานะเมื่อพบข้อยกเว้น:",
      exceptionPrefix: "ข้อยกเว้น:",
    },
  } as const,
} as const;
