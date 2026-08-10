// ============================================================
// Nexova Solutions — Validaciones de negocio
// ============================================================
// Funciones que verifican que los datos cumplan con las reglas
// específicas de Nexova antes de ser procesados o almacenados.
// ============================================================

import {
  Candidate,
  JobVacancy,
  TrainingProgram,
  Enrollment,
  SupportTicket,
  SalesOpportunity,
  Employee,
  ValidationResult,
} from '../types/models';

// -------------------------------------------------------
// Utilidad interna para construir ValidationResult
// -------------------------------------------------------

function success(): ValidationResult {
  return { valid: true, errors: [] };
}

function failure(errors: string[]): ValidationResult {
  return { valid: false, errors };
}

// -------------------------------------------------------
// Validaciones de Candidato
// -------------------------------------------------------

const VALID_ENGLISH_LEVELS = ['basico', 'intermedio', 'avanzado', 'nativo'] as const;
const VALID_CANDIDATE_STATUSES = [
  'nuevo',
  'en_revision',
  'entrevistado',
  'preseleccionado',
  'rechazado',
  'contratado',
] as const;

/**
 * Valida que los datos de un candidato cumplan las reglas de negocio.
 *
 * Reglas:
 * - Todos los campos obligatorios deben estar presentes
 * - El email debe tener formato válido
 * - experienceYears debe ser >= 0 y <= 50
 * - score debe estar entre 0 y 100
 * - englishLevel debe ser un valor válido
 * - status debe ser un valor válido
 *
 * @param candidate - Candidato a validar
 * @returns Resultado de la validación
 */
export function validateCandidate(candidate: Candidate): ValidationResult {
  const errors: string[] = [];

  // Campos obligatorios
  if (!candidate.id) errors.push('El id del candidato es obligatorio');
  if (!candidate.firstName?.trim()) errors.push('El nombre del candidato es obligatorio');
  if (!candidate.lastName?.trim()) errors.push('El apellido del candidato es obligatorio');

  // Email
  if (!candidate.email?.trim()) {
    errors.push('El email del candidato es obligatorio');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) {
    errors.push(`El email "${candidate.email}" no tiene un formato válido`);
  }

  // Experiencia
  if (candidate.experienceYears == null) {
    errors.push('Los años de experiencia son obligatorios');
  } else if (candidate.experienceYears < 0) {
    errors.push('Los años de experiencia no pueden ser negativos');
  } else if (candidate.experienceYears > 50) {
    errors.push('Los años de experiencia no pueden superar 50');
  }

  // Score
  if (candidate.score == null) {
    errors.push('El score del candidato es obligatorio');
  } else if (candidate.score < 0 || candidate.score > 100) {
    errors.push(`El score debe estar entre 0 y 100 (recibido: ${candidate.score})`);
  }

  // English level
  if (candidate.englishLevel && !VALID_ENGLISH_LEVELS.includes(candidate.englishLevel as any)) {
    errors.push(
      `Nivel de inglés inválido: "${candidate.englishLevel}". Valores válidos: ${VALID_ENGLISH_LEVELS.join(', ')}`
    );
  }

  // Status
  if (candidate.status && !VALID_CANDIDATE_STATUSES.includes(candidate.status as any)) {
    errors.push(
      `Estado de candidato inválido: "${candidate.status}". Valores válidos: ${VALID_CANDIDATE_STATUSES.join(', ')}`
    );
  }

  return errors.length === 0 ? success() : failure(errors);
}

// -------------------------------------------------------
// Validaciones de Vacante
// -------------------------------------------------------

const VALID_VACANCY_STATUSES = ['abierta', 'en_proceso', 'pausada', 'cerrada'] as const;

/**
 * Valida que los datos de una vacante cumplan las reglas de negocio.
 *
 * Reglas:
 * - Título, departamento y cliente obligatorios
 * - budget debe ser un número positivo
 * - minExperience >= 0
 * - maxExperience > minExperience (si se especifica)
 * - status debe ser válido
 *
 * @param vacancy - Vacante a validar
 * @returns Resultado de la validación
 */
export function validateJobVacancy(vacancy: JobVacancy): ValidationResult {
  const errors: string[] = [];

  if (!vacancy.id) errors.push('El id de la vacante es obligatorio');
  if (!vacancy.title?.trim()) errors.push('El título de la vacante es obligatorio');
  if (!vacancy.clientId) errors.push('El cliente asociado es obligatorio');

  if (vacancy.budget == null) {
    errors.push('El presupuesto es obligatorio');
  } else if (vacancy.budget <= 0) {
    errors.push('El presupuesto debe ser un número positivo');
  }

  if (vacancy.minExperience == null) {
    errors.push('La experiencia mínima es obligatoria');
  } else if (vacancy.minExperience < 0) {
    errors.push('La experiencia mínima no puede ser negativa');
  }

  if (vacancy.maxExperience != null && vacancy.minExperience != null) {
    if (vacancy.maxExperience <= vacancy.minExperience) {
      errors.push('La experiencia máxima debe ser mayor que la experiencia mínima');
    }
  }

  if (vacancy.status && !VALID_VACANCY_STATUSES.includes(vacancy.status as any)) {
    errors.push(
      `Estado de vacante inválido: "${vacancy.status}". Valores válidos: ${VALID_VACANCY_STATUSES.join(', ')}`
    );
  }

  // Fechas coherentes
  if (vacancy.closedAt && vacancy.createdAt && vacancy.closedAt < vacancy.createdAt) {
    errors.push('La fecha de cierre no puede ser anterior a la fecha de creación');
  }

  return errors.length === 0 ? success() : failure(errors);
}

// -------------------------------------------------------
// Validaciones de Programa de Formación
// -------------------------------------------------------

const VALID_TRAINING_CATEGORIES = [
  'liderazgo',
  'comunicacion',
  'gestion_equipos',
  'habilidades_blandas',
  'tecnico',
] as const;

const VALID_MODALITIES = ['online', 'presencial', 'mixto'] as const;

/**
 * Valida que los datos de un programa de formación cumplan las reglas.
 *
 * Reglas:
 * - Campos obligatorios presentes
 * - durationHours > 0 y <= 1000
 * - maxParticipants > 0
 * - pricePerParticipant >= 0
 *
 * @param program - Programa a validar
 * @returns Resultado de la validación
 */
export function validateTrainingProgram(program: TrainingProgram): ValidationResult {
  const errors: string[] = [];

  if (!program.id) errors.push('El id del programa es obligatorio');
  if (!program.title?.trim()) errors.push('El título del programa es obligatorio');
  if (!program.category) errors.push('La categoría es obligatoria');

  if (program.durationHours == null) {
    errors.push('La duración en horas es obligatoria');
  } else if (program.durationHours <= 0) {
    errors.push('La duración debe ser mayor a 0 horas');
  } else if (program.durationHours > 1000) {
    errors.push('La duración no puede superar las 1000 horas');
  }

  if (program.maxParticipants == null) {
    errors.push('El máximo de participantes es obligatorio');
  } else if (program.maxParticipants <= 0) {
    errors.push('El máximo de participantes debe ser mayor a 0');
  }

  if (program.pricePerParticipant == null) {
    errors.push('El precio por participante es obligatorio');
  } else if (program.pricePerParticipant < 0) {
    errors.push('El precio por participante no puede ser negativo');
  }

  if (program.modality && !VALID_MODALITIES.includes(program.modality as any)) {
    errors.push(
      `Modalidad inválida: "${program.modality}". Valores válidos: ${VALID_MODALITIES.join(', ')}`
    );
  }

  if (program.category && !VALID_TRAINING_CATEGORIES.includes(program.category as any)) {
    errors.push(
      `Categoría inválida: "${program.category}". Valores válidos: ${VALID_TRAINING_CATEGORIES.join(', ')}`
    );
  }

  return errors.length === 0 ? success() : failure(errors);
}

// -------------------------------------------------------
// Validaciones de Inscripción
// -------------------------------------------------------

const VALID_ENROLLMENT_STATUSES = ['inscrito', 'en_curso', 'completado', 'abandonado'] as const;

/**
 * Valida que los datos de una inscripción cumplan las reglas.
 *
 * Reglas:
 * - Campos obligatorios presentes
 * - progressPercent debe estar entre 0 y 100
 * - Si está completado, debe tener completedDate
 * - enrolledDate no puede ser futura
 *
 * @param enrollment - Inscripción a validar
 * @returns Resultado de la validación
 */
export function validateEnrollment(enrollment: Enrollment): ValidationResult {
  const errors: string[] = [];

  if (!enrollment.id) errors.push('El id de la inscripción es obligatorio');
  if (!enrollment.programId) errors.push('El programa es obligatorio');
  if (!enrollment.participantName?.trim()) errors.push('El nombre del participante es obligatorio');
  if (!enrollment.participantEmail?.trim()) errors.push('El email del participante es obligatorio');

  if (enrollment.progressPercent == null) {
    errors.push('El progreso es obligatorio');
  } else if (enrollment.progressPercent < 0 || enrollment.progressPercent > 100) {
    errors.push(`El progreso debe estar entre 0 y 100 (recibido: ${enrollment.progressPercent})`);
  }

  if (enrollment.status && !VALID_ENROLLMENT_STATUSES.includes(enrollment.status as any)) {
    errors.push(
      `Estado de inscripción inválido: "${enrollment.status}". Valores válidos: ${VALID_ENROLLMENT_STATUSES.join(', ')}`
    );
  }

  if (enrollment.status === 'completado' && !enrollment.completedDate) {
    errors.push('Una inscripción completada debe tener una fecha de finalización');
  }

  if (enrollment.enrolledDate && enrollment.enrolledDate > new Date()) {
    errors.push('La fecha de inscripción no puede ser futura');
  }

  return errors.length === 0 ? success() : failure(errors);
}

// -------------------------------------------------------
// Validaciones de Ticket de Soporte
// -------------------------------------------------------

const VALID_PRIORITIES = ['baja', 'media', 'alta', 'critica'] as const;
const VALID_TICKET_STATUSES = ['abierto', 'en_progreso', 'resuelto', 'cerrado'] as const;
const VALID_CHANNELS = ['telefono', 'email', 'chat'] as const;

/**
 * Valida que los datos de un ticket de soporte cumplan las reglas.
 *
 * Reglas:
 * - Campos obligatorios presentes
 * - slaDeadline debe ser posterior a createdDate
 * - Si está resuelto, debe tener resolvedDate
 * - priority, status, channel deben ser valores válidos
 *
 * @param ticket - Ticket a validar
 * @returns Resultado de la validación
 */
export function validateSupportTicket(ticket: SupportTicket): ValidationResult {
  const errors: string[] = [];

  if (!ticket.id) errors.push('El id del ticket es obligatorio');
  if (!ticket.clientId) errors.push('El cliente es obligatorio');
  if (!ticket.subject?.trim()) errors.push('El asunto del ticket es obligatorio');

  if (ticket.priority && !VALID_PRIORITIES.includes(ticket.priority as any)) {
    errors.push(
      `Prioridad inválida: "${ticket.priority}". Valores válidos: ${VALID_PRIORITIES.join(', ')}`
    );
  }

  if (ticket.status && !VALID_TICKET_STATUSES.includes(ticket.status as any)) {
    errors.push(
      `Estado de ticket inválido: "${ticket.status}". Valores válidos: ${VALID_TICKET_STATUSES.join(', ')}`
    );
  }

  if (ticket.channel && !VALID_CHANNELS.includes(ticket.channel as any)) {
    errors.push(
      `Canal inválido: "${ticket.channel}". Valores válidos: ${VALID_CHANNELS.join(', ')}`
    );
  }

  if (ticket.createdDate && ticket.slaDeadline && ticket.slaDeadline <= ticket.createdDate) {
    errors.push('El SLA deadline debe ser posterior a la fecha de creación');
  }

  if (
    (ticket.status === 'resuelto' || ticket.status === 'cerrado') &&
    ticket.resolvedDate &&
    ticket.createdDate &&
    ticket.resolvedDate < ticket.createdDate
  ) {
    errors.push('La fecha de resolución no puede ser anterior a la fecha de creación');
  }

  return errors.length === 0 ? success() : failure(errors);
}

// -------------------------------------------------------
// Validaciones de Oportunidad de Venta
// -------------------------------------------------------

const VALID_DEAL_STAGES = [
  'prospeccion',
  'contactado',
  'reunion',
  'propuesta',
  'negociacion',
  'cerrado_ganado',
  'cerrado_perdido',
] as const;

/**
 * Valida que los datos de una oportunidad de venta cumplan las reglas.
 *
 * Reglas:
 * - Campos obligatorios presentes
 * - amount debe ser > 0
 * - probability debe estar entre 0 y 100
 * - Si stage es 'cerrado_ganado', probability debe ser 100
 * - Si stage es 'cerrado_perdido', probability debe ser 0
 *
 * @param opportunity - Oportunidad a validar
 * @returns Resultado de la validación
 */
export function validateSalesOpportunity(opportunity: SalesOpportunity): ValidationResult {
  const errors: string[] = [];

  if (!opportunity.id) errors.push('El id de la oportunidad es obligatorio');
  if (!opportunity.clientId) errors.push('El cliente es obligatorio');

  if (opportunity.amount == null) {
    errors.push('El monto es obligatorio');
  } else if (opportunity.amount <= 0) {
    errors.push('El monto debe ser un número positivo');
  }

  if (opportunity.probability == null) {
    errors.push('La probabilidad es obligatoria');
  } else if (opportunity.probability < 0 || opportunity.probability > 100) {
    errors.push(`La probabilidad debe estar entre 0 y 100 (recibido: ${opportunity.probability})`);
  }

  if (opportunity.stage && !VALID_DEAL_STAGES.includes(opportunity.stage as any)) {
    errors.push(
      `Etapa inválida: "${opportunity.stage}". Valores válidos: ${VALID_DEAL_STAGES.join(', ')}`
    );
  }

  // Consistencia stage-probability
  if (opportunity.stage === 'cerrado_ganado' && opportunity.probability !== 100) {
    errors.push('Una oportunidad cerrada-ganada debe tener probabilidad 100');
  }

  if (opportunity.stage === 'cerrado_perdido' && opportunity.probability !== 0) {
    errors.push('Una oportunidad cerrada-perdida debe tener probabilidad 0');
  }

  if (opportunity.expectedCloseDate && opportunity.createdAt && opportunity.expectedCloseDate < opportunity.createdAt) {
    errors.push('La fecha de cierre esperada no puede ser anterior a la fecha de creación');
  }

  return errors.length === 0 ? success() : failure(errors);
}

// -------------------------------------------------------
// Validaciones de Empleado
// -------------------------------------------------------

const VALID_CONTRACT_TYPES = ['indefinido', 'temporal', 'practicas', 'freelance'] as const;
const VALID_EMPLOYEE_STATUSES = ['activo', 'de_baja', 'suspendido'] as const;

/**
 * Valida que los datos de un empleado cumplan las reglas.
 *
 * Reglas:
 * - Campos obligatorios presentes
 * - salary > 0
 * - hireDate no puede ser futura
 *
 * @param employee - Empleado a validar
 * @returns Resultado de la validación
 */
export function validateEmployee(employee: Employee): ValidationResult {
  const errors: string[] = [];

  if (!employee.id) errors.push('El id del empleado es obligatorio');
  if (!employee.firstName?.trim()) errors.push('El nombre del empleado es obligatorio');
  if (!employee.lastName?.trim()) errors.push('El apellido del empleado es obligatorio');
  if (!employee.email?.trim()) errors.push('El email del empleado es obligatorio');
  if (!employee.position?.trim()) errors.push('El cargo del empleado es obligatorio');

  if (employee.salary == null) {
    errors.push('El salario es obligatorio');
  } else if (employee.salary <= 0) {
    errors.push('El salario debe ser un número positivo');
  }

  if (employee.contractType && !VALID_CONTRACT_TYPES.includes(employee.contractType as any)) {
    errors.push(
      `Tipo de contrato inválido: "${employee.contractType}". Valores válidos: ${VALID_CONTRACT_TYPES.join(', ')}`
    );
  }

  if (employee.status && !VALID_EMPLOYEE_STATUSES.includes(employee.status as any)) {
    errors.push(
      `Estado de empleado inválido: "${employee.status}". Valores válidos: ${VALID_EMPLOYEE_STATUSES.join(', ')}`
    );
  }

  if (employee.hireDate && employee.hireDate > new Date()) {
    errors.push('La fecha de contratación no puede ser futura');
  }

  return errors.length === 0 ? success() : failure(errors);
}

// -------------------------------------------------------
// Validador genérico
// -------------------------------------------------------

/**
 * Ejecuta múltiples validaciones y combina los resultados.
 *
 * @param validators - Array de funciones validadoras
 * @returns Resultado combinado
 */
export function validateAll(validators: (() => ValidationResult)[]): ValidationResult {
  const allErrors = validators.flatMap((v) => v().errors);
  return allErrors.length === 0 ? success() : failure(allErrors);
}