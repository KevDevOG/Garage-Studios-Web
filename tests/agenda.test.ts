import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  addMonths,
  endMinutes,
  hourMarks,
  layoutLanes,
  minutesLabel,
  monthGrid,
  openingMinutes,
  parseAgendaView,
  spanPercent,
  startMinutes,
  startOfWeek,
  visibleRange,
  weekDays,
} from "@/lib/agenda";

describe("agenda: fechas", () => {
  it("suma días cruzando de mes y de año", () => {
    assert.equal(addDays("2026-11-30", 1), "2026-12-01");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  });

  it("la semana empieza en lunes, también si la fecha es domingo", () => {
    assert.equal(startOfWeek("2026-11-25"), "2026-11-23"); // miércoles
    assert.equal(startOfWeek("2026-11-29"), "2026-11-23"); // domingo
    assert.equal(startOfWeek("2026-11-23"), "2026-11-23"); // lunes
    assert.deepEqual(weekDays("2026-11-25"), [
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ]);
  });

  it("al cambiar de mes conserva el día o usa el último válido", () => {
    assert.equal(addMonths("2026-11-01", 1), "2026-12-01");
    assert.equal(addMonths("2026-12-15", 1), "2027-01-15");
    assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
    assert.equal(addMonths("2026-01-15", -1), "2025-12-15");
  });

  it("la rejilla del mes son semanas completas que cubren todo el mes", () => {
    const november = monthGrid("2026-11-25");
    assert.equal(november.length, 6); // del lun 26 oct al dom 6 dic
    assert.equal(november[0][0], "2026-10-26");
    assert.equal(november[5][6], "2026-12-06");
    assert.ok(november.every((week) => week.length === 7));
    assert.ok(november.flat().includes("2026-11-01"));
    assert.ok(november.flat().includes("2026-11-30"));

    // Febrero de 2027 empieza en lunes y termina en domingo: 4 semanas justas.
    const february = monthGrid("2027-02-10");
    assert.equal(february.length, 4);
    assert.equal(february[0][0], "2027-02-01");
    assert.equal(february[3][6], "2027-02-28");
  });
});

describe("agenda: horas", () => {
  it("distingue medianoche como inicio (0) y como fin (1440)", () => {
    assert.equal(startMinutes("00:00:00"), 0);
    assert.equal(startMinutes("18:30:00"), 1110);
    assert.equal(endMinutes("00:00:00"), 1440);
    assert.equal(endMinutes("24:00:00"), 1440);
    assert.equal(endMinutes("19:00"), 1140);
    assert.equal(startMinutes(null), null);
    assert.equal(endMinutes(undefined), null);
  });

  it("devuelve el horario del estudio por día", () => {
    assert.deepEqual(openingMinutes("2026-11-25"), { open: 960, close: 1320 }); // miércoles 16-22
    assert.deepEqual(openingMinutes("2026-11-28"), { open: 600, close: 1440 }); // sábado 10-00
    assert.deepEqual(openingMinutes("2026-11-29"), { open: 900, close: 1320 }); // domingo 15-22
  });

  it("la ventana visible sigue el horario y se amplía con las sesiones", () => {
    assert.deepEqual(visibleRange(["2026-11-25"]), { start: 960, end: 1320 });
    // Una semana completa: desde la apertura del sábado hasta medianoche.
    assert.deepEqual(visibleRange(weekDays("2026-11-25")), { start: 600, end: 1440 });
    // Una sesión antes de abrir amplía la ventana, redondeando a horas completas.
    assert.deepEqual(visibleRange(["2026-11-25"], [{ start: 870, end: 930 }]), { start: 840, end: 1320 });
    // Una sesión sin hora no afecta.
    assert.deepEqual(visibleRange(["2026-11-25"], [{ start: null, end: null }]), { start: 960, end: 1320 });
  });

  it("calcula posiciones en porcentaje y las recorta a la ventana", () => {
    const range = { start: 960, end: 1320 }; // 6 horas
    assert.deepEqual(spanPercent(1080, 1140, range), { offset: (120 / 360) * 100, size: (60 / 360) * 100 });
    // Un bloqueo de día completo ocupa toda la ventana, no más.
    assert.deepEqual(spanPercent(0, 1439, range), { offset: 0, size: 100 });
    // Un tramo fuera de la ventana no ocupa nada.
    assert.equal(spanPercent(600, 700, range).size, 0);
  });

  it("marca las horas en punto y las etiqueta", () => {
    assert.deepEqual(hourMarks({ start: 960, end: 1140 }), [960, 1020, 1080, 1140]);
    assert.equal(minutesLabel(960), "16:00");
    assert.equal(minutesLabel(1110), "18:30");
    assert.equal(minutesLabel(1440), "00:00");
  });
});

describe("agenda: carriles de sesiones solapadas", () => {
  const ev = (id: string, start: number | null, end: number | null) => ({ id, start, end });

  it("las sesiones que no se solapan ocupan todo el ancho", () => {
    const placed = layoutLanes([ev("a", 960, 1020), ev("b", 1020, 1080)]);
    assert.deepEqual(
      placed.map((p) => [p.event.id, p.lane, p.lanes]),
      [
        ["a", 0, 1],
        ["b", 0, 1],
      ],
    );
  });

  it("las que coinciden se reparten el espacio", () => {
    const placed = layoutLanes([ev("a", 960, 1080), ev("b", 1020, 1140), ev("c", 1200, 1260)]);
    const byId = Object.fromEntries(placed.map((p) => [p.event.id, p]));
    assert.equal(byId.a.lanes, 2);
    assert.equal(byId.b.lanes, 2);
    assert.notEqual(byId.a.lane, byId.b.lane);
    assert.deepEqual([byId.c.lane, byId.c.lanes], [0, 1]);
  });

  it("reutiliza un carril cuando queda libre dentro del mismo grupo", () => {
    // a y b se solapan; c empieza cuando a ya ha terminado pero b sigue.
    const placed = layoutLanes([ev("a", 960, 1020), ev("b", 990, 1140), ev("c", 1020, 1080)]);
    const byId = Object.fromEntries(placed.map((p) => [p.event.id, p]));
    assert.equal(byId.c.lane, byId.a.lane);
    assert.equal(byId.c.lanes, 2);
  });

  it("ignora las sesiones sin hora", () => {
    assert.equal(layoutLanes([ev("a", null, null)]).length, 0);
  });
});

describe("agenda: vista de la URL", () => {
  it("acepta los valores nuevos y los antiguos", () => {
    assert.equal(parseAgendaView("mes"), "mes");
    assert.equal(parseAgendaView("dia"), "dia");
    assert.equal(parseAgendaView("daily"), "dia");
    assert.equal(parseAgendaView("weekly"), "semana");
    assert.equal(parseAgendaView(undefined), "semana");
    assert.equal(parseAgendaView("<script>"), "semana");
  });
});
