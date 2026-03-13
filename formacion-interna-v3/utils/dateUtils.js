/**
 * DateUtils - Utilidades para manejo de fechas
 */

/**
 * Formatea una fecha a string YYYY-MM-DD
 */
export function formatDate(date) {
  if (!date) return null;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  return d.toISOString().split('T')[0];
}

/**
 * Formatea una fecha a string legible en español
 */
export function formatDateSpanish(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calcula días entre dos fechas
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula días restantes hasta una fecha
 */
export function daysUntil(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  
  if (isNaN(target.getTime())) return 0;
  
  // Normalizar a medianoche para cálculo preciso
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  return daysBetween(now, target);
}

/**
 * Verifica si una fecha está vencida
 */
export function isOverdue(targetDate) {
  return daysUntil(targetDate) < 0;
}

/**
 * Verifica si una fecha está próxima a vencer
 */
export function isUpcoming(targetDate, warningDays = 7) {
  const days = daysUntil(targetDate);
  return days >= 0 && days <= warningDays;
}

/**
 * Verifica si una fecha es urgente
 */
export function isUrgent(targetDate, urgentDays = 3) {
  const days = daysUntil(targetDate);
  return days >= 0 && days <= urgentDays;
}

/**
 * Obtiene el estado de una fecha límite
 */
export function getDeadlineStatus(targetDate, warningDays = 7, urgentDays = 3) {
  if (!targetDate) return 'none';
  
  const days = daysUntil(targetDate);
  
  if (days < 0) return 'overdue';
  if (days <= urgentDays) return 'urgent';
  if (days <= warningDays) return 'warning';
  return 'normal';
}

/**
 * Añade días a una fecha
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Obtiene el primer día del mes
 */
export function getFirstDayOfMonth(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Obtiene el último día del mes
 */
export function getLastDayOfMonth(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Verifica si una fecha está en el rango especificado
 */
export function isInDateRange(date, startDate, endDate) {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return d >= start && d <= end;
}

/**
 * Obtiene fechas de la semana actual
 */
export function getCurrentWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lunes como primer día
  
  const monday = new Date(now.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  };
}

/**
 * Obtiene fechas del mes actual
 */
export function getCurrentMonthRange() {
  const now = new Date();
  return {
    start: formatDate(getFirstDayOfMonth(now)),
    end: formatDate(getLastDayOfMonth(now))
  };
}

/**
 * Calcula la edad en años
 */
export function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calcula tiempo transcurrido desde una fecha
 */
export function timeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  
  if (isNaN(past.getTime())) return '';
  
  const diffMs = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays > 0) {
    return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return 'hace un momento';
  }
}

/**
 * Valida formato de fecha YYYY-MM-DD
 */
export function isValidDateFormat(dateString) {
  if (!dateString) return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === formatDate(date);
}

/**
 * Convierte fecha a timestamp
 */
export function toTimestamp(date) {
  const d = new Date(date);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Convierte timestamp a fecha
 */
export function fromTimestamp(timestamp) {
  return new Date(timestamp);
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export function today() {
  return formatDate(new Date());
}

/**
 * Obtiene la fecha de mañana en formato YYYY-MM-DD
 */
export function tomorrow() {
  return formatDate(addDays(new Date(), 1));
}

/**
 * Obtiene la fecha de ayer en formato YYYY-MM-DD
 */
export function yesterday() {
  return formatDate(addDays(new Date(), -1));
}