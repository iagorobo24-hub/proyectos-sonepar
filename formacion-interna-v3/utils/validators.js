/**
 * Validators - Funciones de validación para la aplicación
 */

import { VALIDATION_CONFIG, ROLES, WORK_AREAS } from './constants.js';
import { isValidDateFormat } from './dateUtils.js';

/**
 * Valida datos de empleado
 */
export function validateEmployee(employee) {
  const errors = [];
  
  if (!employee.nombre || employee.nombre.trim().length < VALIDATION_CONFIG.MIN_NAME_LENGTH) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  
  if (employee.nombre && employee.nombre.length > VALIDATION_CONFIG.MAX_NAME_LENGTH) {
    errors.push('El nombre no puede exceder 100 caracteres');
  }
  
  if (!employee.area || !Object.values(WORK_AREAS).includes(employee.area)) {
    errors.push('Área de trabajo inválida');
  }
  
  if (!employee.rol || !Object.values(ROLES).includes(employee.rol)) {
    errors.push('Rol inválido');
  }
  
  if (employee.fechaAlta && !isValidDateFormat(employee.fechaAlta)) {
    errors.push('Fecha de alta inválida');
  }
  
  if (employee.email && !isValidEmail(employee.email)) {
    errors.push('Email inválido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida email
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}