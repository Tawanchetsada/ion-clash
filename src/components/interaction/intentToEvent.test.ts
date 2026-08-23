import { describe, expect, it } from "vitest";
import { intentToEvent } from "./intentToEvent";

describe("intentToEvent", () => {
  it("แปลง place intent เป็น PLACE_ION event", () => {
    expect(
      intentToEvent({
        kind: "place",
        instanceId: "L1:react:a:cat",
        slotId: "L1:slot:0",
      }),
    ).toEqual({
      type: "PLACE_ION",
      instanceId: "L1:react:a:cat",
      slotId: "L1:slot:0",
    });
  });

  it("แปลง move intent เป็น MOVE_ION event", () => {
    expect(
      intentToEvent({
        kind: "move",
        fromSlotId: "L1:slot:0",
        toSlotId: "L1:slot:1",
      }),
    ).toEqual({
      type: "MOVE_ION",
      fromSlotId: "L1:slot:0",
      toSlotId: "L1:slot:1",
    });
  });

  it("แปลง remove intent เป็น REMOVE_ION event", () => {
    expect(
      intentToEvent({
        kind: "remove",
        slotId: "L1:slot:0",
      }),
    ).toEqual({
      type: "REMOVE_ION",
      slotId: "L1:slot:0",
    });
  });

  it("แปลง cancel intent เป็น null", () => {
    expect(
      intentToEvent({
        kind: "cancel",
      }),
    ).toBeNull();
  });
});
