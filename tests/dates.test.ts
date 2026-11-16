import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  todayInStudio,
  nowMinutesInStudio,
  isValidIsoDate,
  isValidTime,
  weekdayOfIsoDate,
  formatIsoDateEs,
  monthRange,
  parsePeriod,
} from "@/lib/dates";

describe("dates: zona Atlantic/Canary", () => {
  it("en verano (UTC+1) a las 23:30 UTC ya es el día siguiente en Canarias", () => {
    const utc = new Date("2026-07-10T23:30:00Z");
    assert.equal(todayInStudio(utc), "2026-07-11");
    assert.equal(nowMinutesInStudio(utc), 30);
  });

  it("en invierno (UTC+0) la fecha coincide con UTC", () => {
    const utc = new Date("2026-01-10T23:30:00Z");
    assert.equal(todayInStudio(utc), "2026-01-10");
    assert.equal(nowMinutesInStudio(utc), 23 * 60 + 30);
  });
});

describe("dates: validación", () => {
  it("acepta solo fechas ISO reales", () => {
    assert.equal(isValidIsoDate("2026-02-28"), true);
    assert.equal(isValidIsoDate("2026-02-30"), false);
    assert.equal(isValidIsoDate("2026-13-01"), false);
    assert.equal(isValidIsoDate("10/02/2026"), false);
    assert.equal(isValidIsoDate("NaN-NaN-NaN"), false);
  });

  it("acepta solo horas HH:mm de 00 a 23", () => {
    assert.equal(isValidTime("16:30"), true);
    assert.equal(isValidTime("24:00"), false);
    assert.equal(isValidTime("9:00"), false);
  });

  it("calcula el día de la semana sin depender de la zona del proceso", () => {
    assert.equal(weekdayOfIsoDate("2026-11-21"), 6); // sábado
    assert.equal(weekdayOfIsoDate("2026-11-22"), 0); // domingo
  });
});

describe("dates: formato y periodos", () => {
  it("formatea fechas ISO en castellano", () => {
    assert.equal(formatIsoDateEs("2026-11-21"), "sábado, 21 de noviembre de 2026");
    assert.equal(formatIsoDateEs("2026-11-21", { day: "2-digit", month: "2-digit", year: "numeric" }), "21/11/2026");
  });

  it("monthRange devuelve primer y último día", () => {
    assert.deepEqual(monthRange(2026, 2), { start: "2026-02-01", end: "2026-02-28" });
    assert.deepEqual(monthRange(2028, 2), { start: "2028-02-01", end: "2028-02-29" });
    assert.deepEqual(monthRange(2026, null), { start: "2026-01-01", end: "2026-12-31" });
  });

  it("parsePeriod acota valores inválidos al periodo actual", () => {
    const now = new Date("2026-11-16T12:00:00Z");
    assert.deepEqual(parsePeriod("13", "2026", now), { month: 11, year: 2026 });
    assert.deepEqual(parsePeriod("abc", "1900", now), { month: 11, year: 2026 });
    assert.deepEqual(parsePeriod(["3"], ["2025"], now), { month: 3, year: 2025 });
    assert.deepEqual(parsePeriod(undefined, undefined, now), { month: 11, year: 2026 });
  });
});
