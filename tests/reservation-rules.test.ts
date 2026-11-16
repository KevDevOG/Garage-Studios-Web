import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateReservationInput,
  validateContactInput,
  isSlotInPast,
  isUuid,
} from "@/lib/reservation-rules";

const NOW = new Date("2026-11-16T12:00:00Z"); // lunes, 12:00 en Canarias (invierno)
const SERVICE_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

const valid = {
  name: "Ana Pérez",
  phone: "+34 600 123 456",
  email: "Ana@Example.com",
  service: SERVICE_ID,
  date: "2026-11-21",
  timeSlot: "16:00",
  notes: "Dos canciones",
  acceptPrivacy: true,
};

describe("validateReservationInput", () => {
  it("acepta una solicitud correcta y normaliza email y espacios", () => {
    const result = validateReservationInput({ ...valid, name: "  Ana Pérez " }, NOW);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.name, "Ana Pérez");
      assert.equal(result.data.email, "ana@example.com");
    }
  });

  it("rechaza fechas pasadas aunque el navegador las envíe", () => {
    const result = validateReservationInput({ ...valid, date: "2026-11-15" }, NOW);
    assert.equal(result.ok, false);
  });

  it("acepta la fecha de hoy", () => {
    const result = validateReservationInput({ ...valid, date: "2026-11-16" }, NOW);
    assert.equal(result.ok, true);
  });

  it("rechaza servicios que no son UUID", () => {
    const result = validateReservationInput({ ...valid, service: "1 OR 1=1" }, NOW);
    assert.equal(result.ok, false);
  });

  it("rechaza horas malformadas y teléfonos cortos", () => {
    assert.equal(validateReservationInput({ ...valid, timeSlot: "25:00" }, NOW).ok, false);
    assert.equal(validateReservationInput({ ...valid, phone: "12345" }, NOW).ok, false);
  });

  it("exige aceptar la política de privacidad", () => {
    const result = validateReservationInput({ ...valid, acceptPrivacy: "true" }, NOW);
    assert.equal(result.ok, false);
  });

  it("limita la longitud de las observaciones", () => {
    const result = validateReservationInput({ ...valid, notes: "x".repeat(1001) }, NOW);
    assert.equal(result.ok, false);
  });

  it("no revienta con entradas inesperadas", () => {
    assert.equal(validateReservationInput(null, NOW).ok, false);
    assert.equal(validateReservationInput({ name: 42 }, NOW).ok, false);
  });
});

describe("isSlotInPast", () => {
  it("una hora anterior a la actual en el día de hoy ya ha pasado", () => {
    assert.equal(isSlotInPast("2026-11-16", "11:00", NOW), true);
    assert.equal(isSlotInPast("2026-11-16", "12:00", NOW), true);
    assert.equal(isSlotInPast("2026-11-16", "12:30", NOW), false);
  });

  it("mañana nunca ha pasado y ayer siempre", () => {
    assert.equal(isSlotInPast("2026-11-17", "10:00", NOW), false);
    assert.equal(isSlotInPast("2026-11-15", "23:30", NOW), true);
  });
});

describe("validateContactInput", () => {
  it("acepta un mensaje válido con teléfono opcional vacío", () => {
    const result = validateContactInput({
      name: "Luis",
      email: "luis@example.com",
      phone: "",
      subject: "Presupuesto",
      message: "Hola, quiero grabar un EP.",
      acceptPrivacy: true,
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.data.phone, null);
  });

  it("rechaza mensajes demasiado cortos o sin asunto", () => {
    const base = { name: "Luis", email: "luis@example.com", acceptPrivacy: true };
    assert.equal(validateContactInput({ ...base, subject: "", message: "Hola que tal" }).ok, false);
    assert.equal(validateContactInput({ ...base, subject: "Hola", message: "Hi" }).ok, false);
  });
});

describe("isUuid", () => {
  it("distingue UUIDs válidos", () => {
    assert.equal(isUuid(SERVICE_ID), true);
    assert.equal(isUuid("not-a-uuid"), false);
    assert.equal(isUuid(""), false);
  });
});
