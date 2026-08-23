import { describe, expect, it } from "vitest";
import { resolveIntent } from "./resolveIntent";
import type { PlacementSource, PlacementTarget } from "./types";

describe("resolveIntent", () => {
  const cardSource: PlacementSource = {
    kind: "card",
    instanceId: "L1:react:a:cat",
  };

  const slotSource1: PlacementSource = {
    kind: "slot",
    slotId: "L1:slot:0",
    instanceId: "L1:react:a:cat",
  };

  const slotTarget1: PlacementTarget = {
    kind: "slot",
    slotId: "L1:slot:0",
  };

  const slotTarget2: PlacementTarget = {
    kind: "slot",
    slotId: "L1:slot:1",
  };

  const trayTarget: PlacementTarget = {
    kind: "tray",
  };

  it("card -> slot ให้ผลเป็น place", () => {
    expect(resolveIntent(cardSource, slotTarget1)).toEqual({
      kind: "place",
      instanceId: "L1:react:a:cat",
      slotId: "L1:slot:0",
    });
  });

  it("slot -> slot อื่น ให้ผลเป็น move", () => {
    expect(resolveIntent(slotSource1, slotTarget2)).toEqual({
      kind: "move",
      fromSlotId: "L1:slot:0",
      toSlotId: "L1:slot:1",
    });
  });

  it("slot -> slot เดิม ให้ผลเป็น cancel", () => {
    expect(resolveIntent(slotSource1, slotTarget1)).toEqual({
      kind: "cancel",
    });
  });

  it("slot -> tray ให้ผลเป็น remove", () => {
    expect(resolveIntent(slotSource1, trayTarget)).toEqual({
      kind: "remove",
      slotId: "L1:slot:0",
    });
  });

  it("card -> tray ให้ผลเป็น cancel", () => {
    expect(resolveIntent(cardSource, trayTarget)).toEqual({
      kind: "cancel",
    });
  });

  it("card/slot -> null (ปล่อยนอกเป้าหมาย) ให้ผลเป็น cancel", () => {
    expect(resolveIntent(cardSource, null)).toEqual({
      kind: "cancel",
    });
    expect(resolveIntent(slotSource1, null)).toEqual({
      kind: "cancel",
    });
  });
});
