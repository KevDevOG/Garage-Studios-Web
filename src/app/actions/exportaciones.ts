"use server";

import { createClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";
import { createAuditLog } from "@/lib/audit";

export async function exportToExcel(type: "reservas" | "clientes" | "finanzas" | "contactos" | "servicios") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(type.toUpperCase());

  // Configurar columnas según el tipo
  switch (type) {
    case "reservas":
      worksheet.columns = [
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Hora Inicio", key: "hora_inicio", width: 12 },
        { header: "Hora Fin", key: "hora_fin", width: 12 },
        { header: "Nombre", key: "nombre", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Teléfono", key: "telefono", width: 15 },
        { header: "Servicio", key: "servicio", width: 20 },
        { header: "Estado", key: "estado", width: 12 },
        { header: "Estado Pago", key: "estado_pago", width: 12 },
        { header: "Importe Pagado", key: "importe_pagado", width: 15 },
        { header: "Origen", key: "origen", width: 12 },
      ];
      const { data: res } = await supabase.from("reserva").select("*, servicio(nombre)").order("fecha_reserva", { ascending: false });
      res?.forEach(r => worksheet.addRow({
        fecha: r.fecha_reserva,
        hora_inicio: r.hora_inicio,
        hora_fin: r.hora_fin,
        nombre: r.nombre,
        email: r.email,
        telefono: r.telefono,
        servicio: (r.servicio as any)?.nombre || "—",
        estado: r.estado,
        estado_pago: r.estado_pago,
        importe_pagado: r.importe_pagado,
        origen: r.origen
      }));
      break;

    case "clientes":
      worksheet.columns = [
        { header: "Nombre", key: "nombre", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Teléfono", key: "telefono", width: 15 },
        { header: "Instagram", key: "instagram", width: 20 },
        { header: "Estado", key: "estado", width: 12 },
        { header: "Origen", key: "origen", width: 12 },
        { header: "Etiquetas", key: "etiquetas", width: 30 },
        { header: "Total Reservas", key: "total_reservas", width: 15 },
        { header: "Total Pagado", key: "total_pagado", width: 15 },
        { header: "Última Reserva", key: "ultima_reserva", width: 15 },
      ];
      const { data: cli } = await supabase.from("cliente").select("*").order("nombre", { ascending: true });
      cli?.forEach(c => worksheet.addRow({
        nombre: c.nombre,
        email: c.email,
        telefono: c.telefono,
        instagram: c.instagram || "—",
        estado: c.estado,
        origen: c.origen,
        etiquetas: c.etiquetas?.join(", ") || "—",
        total_reservas: c.total_reservas,
        total_pagado: c.total_pagado,
        ultima_reserva: c.ultima_reserva || "—"
      }));
      break;

    case "finanzas":
      worksheet.columns = [
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Tipo", key: "tipo", width: 12 },
        { header: "Categoría", key: "categoria", width: 20 },
        { header: "Concepto", key: "concepto", width: 30 },
        { header: "Importe", key: "importe", width: 12 },
        { header: "Método Pago", key: "metodo_pago", width: 15 },
        { header: "Notas", key: "notas", width: 30 },
      ];
      const { data: fin } = await supabase.from("finanza_movimiento").select("*").order("fecha", { ascending: false });
      fin?.forEach(f => worksheet.addRow({
        fecha: f.fecha,
        tipo: f.tipo,
        categoria: f.categoria,
        concepto: f.concepto,
        importe: f.importe,
        metodo_pago: f.metodo_pago,
        notas: f.notas || "—"
      }));
      break;

    case "contactos":
      worksheet.columns = [
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Nombre", key: "nombre", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Teléfono", key: "telefono", width: 15 },
        { header: "Mensaje", key: "mensaje", width: 50 },
        { header: "Leído", key: "leido", width: 10 },
      ];
      const { data: con } = await supabase.from("contacto").select("*").order("created_at", { ascending: false });
      con?.forEach(c => worksheet.addRow({
        fecha: new Date(c.created_at).toLocaleDateString(),
        nombre: c.nombre,
        email: c.email,
        telefono: c.telefono,
        mensaje: c.mensaje,
        leido: c.leido ? "SÍ" : "NO"
      }));
      break;

    case "servicios":
      worksheet.columns = [
        { header: "Nombre", key: "nombre", width: 25 },
        { header: "Descripción", key: "descripcion", width: 40 },
        { header: "Precio", key: "precio", width: 12 },
        { header: "Duración (min)", key: "duracion", width: 15 },
        { header: "Activo", key: "activo", width: 10 },
        { header: "Orden", key: "orden", width: 10 },
      ];
      const { data: ser } = await supabase.from("servicio").select("*").order("orden", { ascending: true });
      ser?.forEach(s => worksheet.addRow({
        nombre: s.nombre,
        descripcion: s.descripcion,
        precio: s.precio,
        duracion: s.duracion_minutos,
        activo: s.activo ? "SÍ" : "NO",
        orden: s.orden
      }));
      break;
  }

  // Estilo de cabecera
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEEEEE" }
  };

  const buffer = await workbook.xlsx.writeBuffer();

  // Auditoría
  await createAuditLog({
    accion: "exportación",
    entidad: type,
    descripcion: `Exportación de ${type} a Excel generada`,
  });

  return {
    buffer: Buffer.from(buffer).toString("base64"),
    filename: `${type}_${new Date().toISOString().split("T")[0]}.xlsx`
  };
}
