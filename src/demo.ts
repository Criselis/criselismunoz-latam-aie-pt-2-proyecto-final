// Demo de utilidades de datos
// Script de demostración que ejercita todas las funciones
// implementadas en el paquete de utilidades.
//
// Uso: npx tsx src/demo.ts
// ============================================================

import {
  SAMPLE_CANDIDATES,
  SAMPLE_TRAINING_PROGRAMS,
  SAMPLE_TICKETS,
  SAMPLE_SALES_OPPORTUNITIES,
  SAMPLE_ENROLLMENTS,
} from './types/models';

import {
  filterItems,
  filterByRange,
  filterBySet,
  sortBy,
  sortByMultiple,
  groupBy,
  countBy,
  paginate,
  uniqueBy,
  take,
  chunk,
} from './utils/collections';

import {
  linearSearch,
  binarySearch,
  smartSearch,
} from './utils/search';

import {
  numericSummary,
  sumBy,
  averageBy,
  maxBy,
  minBy,
  countByCategory,
  categoryDistribution,
} from './utils/transformations';

import {
  validateCandidate,
  validateTrainingProgram,
  validateEnrollment,
  validateSupportTicket,
  validateSalesOpportunity,
  validateEmployee,
} from './utils/validations';

import type {
  Candidate,
  TrainingProgram,
  Enrollment,
  SupportTicket,
  SalesOpportunity,
  Employee,
} from './types/models';

// ============================================================
// Helper: separadores visuales
// ============================================================

function printSection(title: string): void {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80));
}

function printSubsection(title: string): void {
  console.log('\n' + '-'.repeat(60));
  console.log(`  ${title}`);
  console.log('-'.repeat(60));
}

function printJson(label: string, data: unknown): void {
  console.log(`\n  ${label}:`);
  console.log(`  ${JSON.stringify(data, null, 2).replace(/\n/g, '\n  ')}`);
}

// ============================================================
// 1. SISTEMA DE GESTIÓN DE COLECCIONES
// ============================================================

printSection('1. SISTEMA DE GESTIÓN DE COLECCIONES');

// --- Filtrado ---
printSubsection('1.1 Filtrado');

const filteredActive = filterItems(
  SAMPLE_TRAINING_PROGRAMS,
  (p) => p.status === 'activo'
);
printJson(`Programas activos (${filteredActive.length})`, filteredActive.map((p) => p.title));

const filteredByScore = filterByRange(
  SAMPLE_CANDIDATES,
  (c) => c.score,
  70,
  100
);
printJson(
  `Candidatos con score entre 70-100 (${filteredByScore.length})`,
  filteredByScore.map((c) => `${c.firstName} ${c.lastName}: ${c.score}`)
);

const filteredByStatus = filterBySet(
  SAMPLE_TICKETS,
  (t) => t.status,
  ['abierto', 'en_progreso']
);
printJson(
  `Tickets abiertos o en progreso (${filteredByStatus.length})`,
  filteredByStatus.map((t) => `${t.id}: ${t.subject} [${t.status}]`)
);

// --- Ordenamiento ---
printSubsection('1.2 Ordenamiento');

const sortedByScore = sortBy(SAMPLE_CANDIDATES, (c) => c.score, 'desc');
printJson(
  'Candidatos ordenados por score (desc)',
  sortedByScore.map((c) => `${c.firstName} ${c.lastName}: ${c.score}`)
);

const sortedByPriority = sortBy(SAMPLE_TICKETS, (t) => t.createdDate, 'desc');
printJson(
  'Tickets ordenados por fecha (más reciente primero)',
  sortedByPriority.map((t) => `${t.id}: ${t.createdDate.toISOString().slice(0, 10)}`)
);

const sortedMulti = sortByMultiple(SAMPLE_CANDIDATES, [
  { getValue: (c) => c.status, direction: 'asc' },
  { getValue: (c) => c.score, direction: 'desc' },
]);
printJson(
  'Candidatos ordenados por status y score',
  sortedMulti.map((c) => `${c.firstName} ${c.lastName}: [${c.status}] score=${c.score}`)
);

// --- Agrupación ---
printSubsection('1.3 Agrupación');

const groupedByStatus = groupBy(SAMPLE_CANDIDATES, (c) => c.status);
printJson(
  'Candidatos agrupados por estado',
  Object.fromEntries(
    Object.entries(groupedByStatus).map(([status, candidates]) => [
      status,
      candidates.map((c) => `${c.firstName} ${c.lastName}`),
    ])
  )
);

const countsByStatus = countBy(SAMPLE_CANDIDATES, (c) => c.status);
printJson('Conteo de candidatos por estado', countsByStatus);

const countsByPriority = countBy(SAMPLE_TICKETS, (t) => t.priority);
printJson('Conteo de tickets por prioridad', countsByPriority);

// --- Paginación ---
printSubsection('1.4 Paginación');

const page1 = paginate(SAMPLE_CANDIDATES, 1, 2);
printJson(
  `Página 1 de ${page1.totalPages} (${page1.total} total)`,
  page1.items.map((c) => `${c.id}: ${c.firstName} ${c.lastName}`)
);

const page3 = paginate(SAMPLE_CANDIDATES, 3, 2);
printJson(
  `Página 3 (solicitada, ajustada a ${page3.page})`,
  page3.items.map((c) => `${c.id}: ${c.firstName} ${c.lastName}`)
);

// --- Utilidades ---
printSubsection('1.5 Utilidades adicionales');

const uniqueClients = uniqueBy(SAMPLE_TICKETS, (t) => t.clientId);
printJson(
  `Clientes únicos con tickets (${uniqueClients.length})`,
  uniqueClients.map((t) => t.clientId)
);

const top3Candidates = take(SAMPLE_CANDIDATES, 3);
printJson(
  'Top 3 candidatos (primeros del array)',
  top3Candidates.map((c) => `${c.firstName} ${c.lastName}`)
);

const chunks = chunk(SAMPLE_CANDIDATES, 2);
printJson(
  `Candidatos divididos en chunks de 2 (${chunks.length} chunks)`,
  chunks.map((ch, i) => `Chunk ${i + 1}: [${ch.map((c) => c.firstName).join(', ')}]`)
);

// ============================================================
// 2. BÚSQUEDAS LINEAL Y BINARIA
// ============================================================

printSection('2. BÚSQUEDAS LINEAL Y BINARIA');

// --- Búsqueda lineal ---
printSubsection('2.1 Búsqueda lineal');

const searchResult = linearSearch(SAMPLE_CANDIDATES, (c) => c.email === 'ana.martinez@email.com');
printJson(
  `Búsqueda lineal: Ana Martínez por email`,
  searchResult.found
    ? `Encontrado en índice ${searchResult.index}: ${searchResult.item!.firstName} ${searchResult.item!.lastName}`
    : 'No encontrado'
);

const notFound = linearSearch(SAMPLE_CANDIDATES, (c) => c.email === 'noexiste@email.com');
printJson('Búsqueda lineal: email inexistente', `Encontrado: ${notFound.found}`);

// --- Búsqueda binaria ---
printSubsection('2.2 Búsqueda binaria');

const sortedByScoreAsc = sortBy(SAMPLE_CANDIDATES, (c) => c.score, 'asc');
printJson(
  'Array ordenado por score para búsqueda binaria',
  sortedByScoreAsc.map((c) => `${c.firstName}: score=${c.score}`)
);

const binResult = binarySearch(sortedByScoreAsc, (c) => c.score, 78);
printJson(
  `Búsqueda binaria: score = 78`,
  binResult.found
    ? `Encontrado: ${binResult.item!.firstName} ${binResult.item!.lastName} (índice ${binResult.index})`
    : 'No encontrado'
);

const binNotFound = binarySearch(sortedByScoreAsc, (c) => c.score, 99);
printJson('Búsqueda binaria: score = 99 (no existe)', `Encontrado: ${binNotFound.found}`);

// --- Búsqueda en array vacío ---
printSubsection('2.3 Casos frontera');

const emptyResult = binarySearch([], (c: Candidate) => c.score, 50);
printJson('Búsqueda binaria en array vacío', `Encontrado: ${emptyResult.found}`);

// --- Smart search ---
printSubsection('2.4 Smart search');

const smartResult = smartSearch(SAMPLE_CANDIDATES, (c) => c.experienceYears, 8);
printJson(
  `Smart search: experienceYears = 8`,
  smartResult.found
    ? `Encontrado: ${smartResult.item!.firstName} ${smartResult.item!.lastName}`
    : 'No encontrado'
);

// ============================================================
// 3. TRANSFORMACIONES Y AGREGACIONES
// ============================================================

printSection('3. TRANSFORMACIONES Y AGREGACIONES');

// --- Resumen numérico ---
printSubsection('3.1 Resumen numérico de scores de candidatos');

const scoreSummary = numericSummary(SAMPLE_CANDIDATES, (c) => c.score);
printJson('Resumen de scores', scoreSummary);

const emptySummary = numericSummary([], (c: Candidate) => c.score);
printJson('Resumen de array vacío', emptySummary);

// --- Suma y promedio ---
printSubsection('3.2 Suma y promedio');

const totalBudget = sumBy(SAMPLE_TRAINING_PROGRAMS, (p) => p.pricePerParticipant);
printJson('Suma de precios por participante (todos los programas)', totalBudget);

const avgPrice = averageBy(SAMPLE_TRAINING_PROGRAMS, (p) => p.pricePerParticipant);
printJson('Precio promedio por participante', avgPrice);

const avgExperience = averageBy(SAMPLE_CANDIDATES, (c) => c.experienceYears);
printJson('Promedio de años de experiencia de candidatos', avgExperience);

// --- Máximo y mínimo ---
printSubsection('3.3 Máximo y mínimo');

const bestCandidate = maxBy(SAMPLE_CANDIDATES, (c) => c.score);
printJson(
  'Candidato con mayor score',
  bestCandidate ? `${bestCandidate.firstName} ${bestCandidate.lastName}: ${bestCandidate.score}` : 'N/A'
);

const minExperience = minBy(SAMPLE_CANDIDATES, (c) => c.experienceYears);
printJson(
  'Candidato con menor experiencia',
  minExperience ? `${minExperience.firstName} ${minExperience.lastName}: ${minExperience.experienceYears} años` : 'N/A'
);

const emptyMax = maxBy([], (c: Candidate) => c.score);
printJson('maxBy con array vacío', emptyMax);

// --- Conteo por categoría ---
printSubsection('3.4 Conteo por categoría');

const skillsCount = countByCategory(SAMPLE_CANDIDATES, (c) => c.englishLevel);
printJson('Candidatos por nivel de inglés', skillsCount);

const priorityCount = countByCategory(SAMPLE_TICKETS, (t) => t.priority);
printJson('Tickets por prioridad', priorityCount);

const modalityCount = countByCategory(SAMPLE_TRAINING_PROGRAMS, (p) => p.modality);
printJson('Programas por modalidad', modalityCount);

// --- Distribución porcentual ---
printSubsection('3.5 Distribución porcentual');

const dist = categoryDistribution(SAMPLE_CANDIDATES, (c) => c.status);
printJson('Distribución de candidatos por estado (%)', dist);

// ============================================================
// 4. VALIDACIONES DE NEGOCIO
// ============================================================

printSection('4. VALIDACIONES DE NEGOCIO');

// --- Candidatos ---
printSubsection('4.1 Validación de candidatos');

const validCandidateResult = validateCandidate(SAMPLE_CANDIDATES[0]);
printJson(
  `Validar candidato válido (${SAMPLE_CANDIDATES[0].firstName} ${SAMPLE_CANDIDATES[0].lastName})`,
  validCandidateResult
);

const invalidCandidate: Candidate = {
  id: '',
  firstName: '',
  lastName: 'Test',
  email: 'email-invalido',
  phone: '',
  skills: [],
  experienceYears: -1,
  englishLevel: 'experto' as any,
  currentRole: '',
  status: 'desconocido' as any,
  score: 150,
  appliedDate: new Date(),
};
const invalidCandidateResult = validateCandidate(invalidCandidate);
printJson('Validar candidato inválido', invalidCandidateResult);

// --- Programas de formación ---
printSubsection('4.2 Validación de programas de formación');

const validProgramResult = validateTrainingProgram(SAMPLE_TRAINING_PROGRAMS[0]);
printJson(
  `Validar programa válido (${SAMPLE_TRAINING_PROGRAMS[0].title})`,
  validProgramResult
);

const invalidProgram: TrainingProgram = {
  id: '',
  title: '',
  description: '',
  category: 'invalido' as any,
  durationHours: -5,
  modality: 'remoto' as any,
  maxParticipants: 0,
  pricePerParticipant: -100,
  status: 'activo',
  createdAt: new Date(),
};
const invalidProgramResult = validateTrainingProgram(invalidProgram);
printJson('Validar programa inválido', invalidProgramResult);

// --- Inscripciones ---
printSubsection('4.3 Validación de inscripciones');

const validEnrollmentResult = validateEnrollment(SAMPLE_ENROLLMENTS[0]);
printJson(
  `Validar inscripción válida (${SAMPLE_ENROLLMENTS[0].participantName})`,
  validEnrollmentResult
);

// Inscripción completada sin fecha de finalización
const incompleteEnrollment: Enrollment = { ...SAMPLE_ENROLLMENTS[2], completedDate: undefined, progressPercent: 100 };
const incompleteEnrollmentResult = validateEnrollment(incompleteEnrollment);
printJson('Validar inscripción completada sin fecha', incompleteEnrollmentResult);

// --- Tickets ---
printSubsection('4.4 Validación de tickets de soporte');

const validTicketResult = validateSupportTicket(SAMPLE_TICKETS[0]);
printJson(
  `Validar ticket válido (${SAMPLE_TICKETS[0].id})`,
  validTicketResult
);

const invalidTicket: SupportTicket = {
  id: '',
  clientId: '',
  subject: '',
  description: '',
  priority: 'urgente' as any,
  status: 'invalido' as any,
  channel: 'fax' as any,
  sentiment: 'neutro',
  createdDate: new Date(),
  slaDeadline: new Date('2020-01-01'), // anterior a createdDate
};
const invalidTicketResult = validateSupportTicket(invalidTicket);
printJson('Validar ticket inválido', invalidTicketResult);

// --- Oportunidades de venta ---
printSubsection('4.5 Validación de oportunidades de venta');

const validOppResult = validateSalesOpportunity(SAMPLE_SALES_OPPORTUNITIES[0]);
printJson(
  `Validar oportunidad válida (${SAMPLE_SALES_OPPORTUNITIES[0].id})`,
  validOppResult
);

const inconsistentOpp: SalesOpportunity = {
  id: 'OP_INVALID',
  clientId: 'CL001',
  sdrId: 'SDR001',
  amount: -1000,
  stage: 'cerrado_ganado',
  probability: 50,
  createdAt: new Date(),
  lastActivityDate: new Date(),
};
const inconsistentOppResult = validateSalesOpportunity(inconsistentOpp);
printJson('Validar oportunidad inconsistente (monto negativo, stage vs probability)', inconsistentOppResult);

// --- Empleado ---
printSubsection('4.6 Validación de empleado');

const invalidEmployee: Employee = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  department: 'ventas',
  position: '',
  contractType: 'vitalicio' as any,
  hireDate: new Date('2030-01-01'), // fecha futura
  salary: 0,
  status: 'inactivo' as any,
};
const invalidEmployeeResult = validateEmployee(invalidEmployee);
printJson('Validar empleado inválido', invalidEmployeeResult);

// ============================================================
// 5. RESUMEN FINAL
// ============================================================

printSection('RESUMEN');

console.log('\n  ✅  Todas las utilidades ejecutadas correctamente.');
console.log(`\n  📦  Datos de ejemplo:`);
console.log(`       - ${SAMPLE_CANDIDATES.length} candidatos`);
console.log(`       - ${SAMPLE_TRAINING_PROGRAMS.length} programas de formación`);
console.log(`       - ${SAMPLE_TICKETS.length} tickets de soporte`);
console.log(`       - ${SAMPLE_SALES_OPPORTUNITIES.length} oportunidades de venta`);
console.log(`       - ${SAMPLE_ENROLLMENTS.length} inscripciones`);
console.log(`\n  📁  Archivos implementados:`);
console.log(`       src/types/models.ts`);
console.log(`       src/utils/collections.ts`);
console.log(`       src/utils/search.ts`);
console.log(`       src/utils/transformations.ts`);
console.log(`       src/utils/validations.ts`);
console.log(`       src/demo.ts`);