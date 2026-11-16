import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  timeToMinutes,
  minutesToTime,
  formatTime,
  generateTimeSlots,
  isSlotAvailable,
  isSlotWithinOpeningHours,
  END_OF_DAY_MINUTES,
} from "@/lib/schedule";

describe("schedule: conversión de horas", () => {
  it("convierte HH:mm a minutos", () => {
    assert.equal(timeToMinutes("16:00"), 960);
    assert.equal(timeToMinutes("16:30:00"), 990);
  });

  it("trata 00:00 y 24:00 como fin de día (1440)", () => {
    assert.equal(timeToMinutes("00:00"), END_OF_DAY_MINUTES);
    assert.equal(timeToMinutes("24:00"), END_OF_DAY_MINUTES);
    assert.equal(timeToMinutes("24:00:00"), END_OF_DAY_MINUTES);
  });

  it("guarda el fin de día como 24:00 para no invertir el tsrange", () => {
    assert.equal(minutesToTime(1440), "24:00");
    assert.equal(minutesToTime(1380), "23:00");
    assert.equal(minutesToTime(600), "10:00");
  });

  it("muestra 24:00 como 00:00 y normaliza HH:mm:ss", () => {
    assert.equal(formatTime("24:00:00"), "00:00");
    assert.equal(formatTime("16:30:00"), "16:30");
    assert.equal(formatTime(null), "--:--");
  });
});

describe("schedule: generación de slots", () => {
  it("el sábado (10:00-00:00) admite una sesión de 2h que termina a medianoche", () => {
    const slots = generateTimeSlots(6, 120);
    assert.equal(slots[0], "10:00");
    assert.equal(slots[slots.length - 1], "22:00");
  });

  it("entre semana (16:00-22:00) una sesión de 2h termina como tarde a las 22:00", () => {
    const slots = generateTimeSlots(1, 120);
    assert.deepEqual(slots, ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"]);
  });

  it("un servicio más largo que la jornada no genera slots", () => {
    assert.deepEqual(generateTimeSlots(1, 7 * 60), []);
  });

  it("isSlotWithinOpeningHours rechaza horas fuera de apertura o desalineadas", () => {
    assert.equal(isSlotWithinOpeningHours(1, "16:00", 60), true);
    assert.equal(isSlotWithinOpeningHours(1, "03:00", 60), false);
    assert.equal(isSlotWithinOpeningHours(1, "16:15", 60), false);
    assert.equal(isSlotWithinOpeningHours(1, "21:30", 60), false); // terminaría a las 22:30
  });
});

describe("schedule: solapamientos", () => {
  const occupied = [{ start: timeToMinutes("16:00"), end: timeToMinutes("18:00") }];

  it("detecta solapamiento parcial y total", () => {
    assert.equal(isSlotAvailable(timeToMinutes("17:00"), 60, occupied), false);
    assert.equal(isSlotAvailable(timeToMinutes("15:00"), 120, occupied), false);
    assert.equal(isSlotAvailable(timeToMinutes("15:30"), 60, occupied), false);
  });

  it("permite reservas adyacentes", () => {
    assert.equal(isSlotAvailable(timeToMinutes("18:00"), 60, occupied), true);
    assert.equal(isSlotAvailable(timeToMinutes("15:00"), 60, occupied), true);
  });

  it("una reserva que termina a medianoche (24:00) bloquea la franja anterior", () => {
    const late = [{ start: timeToMinutes("22:00"), end: timeToMinutes("24:00:00") }];
    assert.equal(isSlotAvailable(timeToMinutes("23:00"), 60, late), false);
    assert.equal(isSlotAvailable(timeToMinutes("21:00"), 60, late), true);
  });
});
