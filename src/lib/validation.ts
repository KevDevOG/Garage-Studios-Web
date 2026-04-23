// ── Validación de formularios ────────────────────────────
// Funciones de validación reutilizables.
// Devuelven un string con el mensaje de error, o null si es válido.

/**
 * Valida que un campo no esté vacío.
 */
export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) {
    return `${fieldName} es obligatorio`;
  }
  return null;
}

/**
 * Valida formato de email.
 */
export function validateEmail(value: string): string | null {
  if (!value.trim()) {
    return "El email es obligatorio";
  }
  // Regex simple pero efectivo para validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return "Introduce un email válido (ej: tu@email.com)";
  }
  return null;
}

/**
 * Valida formato de teléfono (mínimo 9 dígitos).
 */
export function validatePhone(value: string, required = false): string | null {
  if (!value.trim()) {
    return required ? "El teléfono es obligatorio" : null;
  }
  // Extraer solo dígitos para contar
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9) {
    return "El teléfono debe tener al menos 9 dígitos";
  }
  return null;
}

/**
 * Valida que se haya seleccionado una opción del select.
 */
export function validateSelect(value: string, fieldName: string): string | null {
  if (!value) {
    return `Selecciona un ${fieldName}`;
  }
  return null;
}

/**
 * Valida que la fecha no esté vacía y sea futura o de hoy.
 */
export function validateDate(value: string): string | null {
  if (!value) {
    return "La fecha es obligatoria";
  }
  const selected = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selected < today) {
    return "La fecha debe ser hoy o posterior";
  }
  return null;
}
