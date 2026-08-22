import type { IonDef } from "./types";

/**
 * ทะเบียนไอออน 22 ตัว — 12 ไอออนบวก 10 ไอออนลบ
 *
 * ตัดออกจากสำรับการ์ดกายภาพตาม D-02: O2- (อยู่ในน้ำไม่ได้ ไฮโดรไลซ์เป็น OH-
 * ทันที) และ MnO4 2- (ไม่อยู่ในหลักสูตร ม.4 และไม่เสถียร) ส่วน CN- ตัดออก
 * เพราะเป็นสารพิษร้ายแรงและตะกอนไซยาไนด์ไม่อยู่ในหลักสูตร
 *
 * ฟิลด์ `atoms` คือหัวใจ เพราะทำให้ทดสอบการอนุรักษ์อะตอมได้จริง
 * ไม่ใช่แค่เชื่อว่าสูตรถูก
 */

export const CATIONS: readonly IonDef[] = [
  {
    ionId: "sodium-plus",
    core: "Na",
    charge: 1,
    nameTh: "โซเดียมไอออน",
    nameStemTh: "โซเดียม",
    polyatomic: false,
    atoms: { Na: 1 },
  },
  {
    ionId: "potassium-plus",
    core: "K",
    charge: 1,
    nameTh: "โพแทสเซียมไอออน",
    nameStemTh: "โพแทสเซียม",
    polyatomic: false,
    atoms: { K: 1 },
  },
  {
    ionId: "ammonium",
    core: "NH4",
    charge: 1,
    nameTh: "แอมโมเนียมไอออน",
    nameStemTh: "แอมโมเนียม",
    polyatomic: true,
    atoms: { N: 1, H: 4 },
  },
  {
    ionId: "silver-plus",
    core: "Ag",
    charge: 1,
    nameTh: "ซิลเวอร์(I) ไอออน",
    nameStemTh: "ซิลเวอร์",
    polyatomic: false,
    atoms: { Ag: 1 },
  },
  {
    ionId: "calcium-2plus",
    core: "Ca",
    charge: 2,
    nameTh: "แคลเซียมไอออน",
    nameStemTh: "แคลเซียม",
    polyatomic: false,
    atoms: { Ca: 1 },
  },
  {
    ionId: "magnesium-2plus",
    core: "Mg",
    charge: 2,
    nameTh: "แมกนีเซียมไอออน",
    nameStemTh: "แมกนีเซียม",
    polyatomic: false,
    atoms: { Mg: 1 },
  },
  {
    ionId: "copper-2plus",
    core: "Cu",
    charge: 2,
    nameTh: "คอปเปอร์(II) ไอออน",
    nameStemTh: "คอปเปอร์(II)",
    polyatomic: false,
    atoms: { Cu: 1 },
  },
  {
    ionId: "iron-2plus",
    core: "Fe",
    charge: 2,
    nameTh: "ไอรอน(II) ไอออน",
    nameStemTh: "ไอรอน(II)",
    polyatomic: false,
    atoms: { Fe: 1 },
  },
  {
    ionId: "barium-2plus",
    core: "Ba",
    charge: 2,
    nameTh: "แบเรียมไอออน",
    nameStemTh: "แบเรียม",
    polyatomic: false,
    atoms: { Ba: 1 },
  },
  {
    ionId: "lead-2plus",
    core: "Pb",
    charge: 2,
    nameTh: "เลด(II) ไอออน",
    nameStemTh: "เลด(II)",
    polyatomic: false,
    atoms: { Pb: 1 },
  },
  {
    ionId: "iron-3plus",
    core: "Fe",
    charge: 3,
    nameTh: "ไอรอน(III) ไอออน",
    nameStemTh: "ไอรอน(III)",
    polyatomic: false,
    atoms: { Fe: 1 },
  },
  {
    ionId: "aluminium-3plus",
    core: "Al",
    charge: 3,
    nameTh: "อะลูมิเนียมไอออน",
    nameStemTh: "อะลูมิเนียม",
    polyatomic: false,
    atoms: { Al: 1 },
  },
];

export const ANIONS: readonly IonDef[] = [
  {
    ionId: "nitrate",
    core: "NO3",
    charge: -1,
    nameTh: "ไนเตรตไอออน",
    nameStemTh: "ไนเตรต",
    polyatomic: true,
    atoms: { N: 1, O: 3 },
  },
  {
    ionId: "chloride",
    core: "Cl",
    charge: -1,
    nameTh: "คลอไรด์ไอออน",
    nameStemTh: "คลอไรด์",
    polyatomic: false,
    atoms: { Cl: 1 },
  },
  {
    ionId: "bromide",
    core: "Br",
    charge: -1,
    nameTh: "โบรไมด์ไอออน",
    nameStemTh: "โบรไมด์",
    polyatomic: false,
    atoms: { Br: 1 },
  },
  {
    ionId: "iodide",
    core: "I",
    charge: -1,
    nameTh: "ไอโอไดด์ไอออน",
    nameStemTh: "ไอโอไดด์",
    polyatomic: false,
    atoms: { I: 1 },
  },
  {
    ionId: "hydroxide",
    core: "OH",
    charge: -1,
    nameTh: "ไฮดรอกไซด์ไอออน",
    nameStemTh: "ไฮดรอกไซด์",
    polyatomic: true,
    atoms: { O: 1, H: 1 },
  },
  {
    ionId: "thiocyanate",
    core: "SCN",
    charge: -1,
    nameTh: "ไทโอไซยาเนตไอออน",
    nameStemTh: "ไทโอไซยาเนต",
    polyatomic: true,
    atoms: { S: 1, C: 1, N: 1 },
  },
  {
    ionId: "sulfate",
    core: "SO4",
    charge: -2,
    nameTh: "ซัลเฟตไอออน",
    nameStemTh: "ซัลเฟต",
    polyatomic: true,
    atoms: { S: 1, O: 4 },
  },
  {
    ionId: "carbonate",
    core: "CO3",
    charge: -2,
    nameTh: "คาร์บอเนตไอออน",
    nameStemTh: "คาร์บอเนต",
    polyatomic: true,
    atoms: { C: 1, O: 3 },
  },
  {
    ionId: "sulfide",
    core: "S",
    charge: -2,
    nameTh: "ซัลไฟด์ไอออน",
    nameStemTh: "ซัลไฟด์",
    polyatomic: false,
    atoms: { S: 1 },
  },
  {
    ionId: "phosphate",
    core: "PO4",
    charge: -3,
    nameTh: "ฟอสเฟตไอออน",
    nameStemTh: "ฟอสเฟต",
    polyatomic: true,
    atoms: { P: 1, O: 4 },
  },
];

export const ALL_IONS: readonly IonDef[] = [...CATIONS, ...ANIONS];

const ION_BY_ID: ReadonlyMap<string, IonDef> = new Map(
  ALL_IONS.map((ion) => [ion.ionId, ion]),
);

/**
 * คืน IonDef จาก id — throw เมื่อไม่พบ แทนที่จะคืน undefined
 * เพราะ ionId ที่ไม่มีในทะเบียนคือความผิดพลาดของข้อมูล ไม่ใช่กรณีปกติ
 */
export function getIon(ionId: string): IonDef {
  const ion = ION_BY_ID.get(ionId);
  if (!ion) {
    throw new Error(`ไม่พบไอออน '${ionId}' ในทะเบียน`);
  }
  return ion;
}

export function isCation(ion: IonDef): boolean {
  return ion.charge > 0;
}

export function isAnion(ion: IonDef): boolean {
  return ion.charge < 0;
}
