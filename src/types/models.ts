// Modelos de datos del negocio: se definen las interfaces principales que representan las entidades del negocio de Nexova Solutions.

// Enumeraciones comunes

export type Department =
  | 'seleccion'
  | 'formacion'
  | 'soporte'
  | 'ventas'
  | 'marketing'
  | 'rrhh'
  | 'tecnologia'
  | 'direccion';

export type Priority = 'baja' | 'media' | 'alta' | 'critica';

export type Status = 'activo' | 'inactivo';

// Cliente (empresa contratante)

export interface Client {
  id: string;
  name: string;
  industry: 'tecnologia' | 'retail' | 'servicios_financieros' | 'otros';
  size: 'pequena' | 'mediana' | 'grande';
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  since: Date;
  active: boolean;
}

// Candidato (Operaciones de Selección)

export type CandidateStatus =
  | 'nuevo'
  | 'en_revision'
  | 'entrevistado'
  | 'preseleccionado'
  | 'rechazado'
  | 'contratado';

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  englishLevel: 'basico' | 'intermedio' | 'avanzado' | 'nativo';
  currentRole: string;
  status: CandidateStatus;
  score: number; // 0-100
  appliedDate: Date;
  vacancyId?: string;
}

// Vacante (puesto a cubrir)

export type VacancyStatus = 'abierta' | 'en_proceso' | 'pausada' | 'cerrada';

export interface JobVacancy {
  id: string;
  title: string;
  department: Department;
  clientId: string;
  requiredSkills: string[];
  minExperience: number;
  maxExperience?: number;
  budget: number;
  status: VacancyStatus;
  createdAt: Date;
  closedAt?: Date;
}

// Programa de Formación (Formación Corporativa)

export type TrainingModality = 'online' | 'presencial' | 'mixto';
export type TrainingStatus = 'borrador' | 'activo' | 'completado' | 'cancelado';

export interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  category: 'liderazgo' | 'comunicacion' | 'gestion_equipos' | 'habilidades_blandas' | 'tecnico';
  durationHours: number;
  modality: TrainingModality;
  maxParticipants: number;
  pricePerParticipant: number;
  status: TrainingStatus;
  createdAt: Date;
}

// Inscripción (alumno en programa formativo)

export type EnrollmentStatus = 'inscrito' | 'en_curso' | 'completado' | 'abandonado';

export interface Enrollment {
  id: string;
  programId: string;
  clientId: string;
  participantName: string;
  participantEmail: string;
  enrolledDate: Date;
  completedDate?: Date;
  status: EnrollmentStatus;
  progressPercent: number; // 0-100
}

// Ticket de Soporte (Atención al Cliente)

export type TicketStatus = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
export type TicketChannel = 'telefono' | 'email' | 'chat';

export interface SupportTicket {
  id: string;
  clientId: string;
  agentId?: string;
  subject: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  channel: TicketChannel;
  sentiment: 'positivo' | 'neutro' | 'negativo';
  createdDate: Date;
  resolvedDate?: Date;
  slaDeadline: Date;
}

// Oportunidad de Venta (Ventas y Desarrollo de Negocio)

export type DealStage =
  | 'prospeccion'
  | 'contactado'
  | 'reunion'
  | 'propuesta'
  | 'negociacion'
  | 'cerrado_ganado'
  | 'cerrado_perdido';

export interface SalesOpportunity {
  id: string;
  clientId: string;
  sdrId: string;
  amount: number;
  stage: DealStage;
  probability: number; // 0-100
  createdAt: Date;
  lastActivityDate: Date;
  expectedCloseDate?: Date;
  notes?: string;
}

// Empleado interno (RRHH)

export type ContractType = 'indefinido' | 'temporal' | 'practicas' | 'freelance';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  position: string;
  contractType: ContractType;
  hireDate: Date;
  salary: number;
  status: 'activo' | 'de_baja' | 'suspendido';
}

// Tipos auxiliares para reportes y agregaciones

export interface CategoryCount {
  category: string;
  count: number;
}

export interface NumericSummary {
  sum: number;
  average: number;
  min: number;
  max: number;
  count: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Objetos literales de ejemplo (instancias concretas)

export const SAMPLE_CANDIDATES: Candidate[] = [
  {
    id: 'C001',
    firstName: 'Ana',
    lastName: 'Martínez',
    email: 'ana.martinez@email.com',
    phone: '+34 612 345 678',
    skills: ['ventas B2B', 'negociación', 'CRM', 'inglés'],
    experienceYears: 8,
    englishLevel: 'avanzado',
    currentRole: 'Ejecutiva de Cuentas Senior',
    status: 'entrevistado',
    score: 85,
    appliedDate: new Date('2026-07-10'),
  },
  {
    id: 'C002',
    firstName: 'Carlos',
    lastName: 'López',
    email: 'carlos.lopez@email.com',
    phone: '+34 623 456 789',
    skills: ['ventas B2B', 'atención al cliente', 'liderazgo'],
    experienceYears: 12,
    englishLevel: 'nativo',
    currentRole: 'Director Comercial',
    status: 'preseleccionado',
    score: 92,
    appliedDate: new Date('2026-07-05'),
  },
  {
    id: 'C003',
    firstName: 'Elena',
    lastName: 'García',
    email: 'elena.garcia@email.com',
    phone: '+34 634 567 890',
    skills: ['marketing digital', 'SEO', 'content strategy'],
    experienceYears: 5,
    englishLevel: 'intermedio',
    currentRole: 'Marketing Specialist',
    status: 'nuevo',
    score: 68,
    appliedDate: new Date('2026-08-01'),
  },
  {
    id: 'C004',
    firstName: 'David',
    lastName: 'Rodríguez',
    email: 'david.rodriguez@email.com',
    phone: '+34 645 678 901',
    skills: ['soporte técnico', 'bases de datos', 'cloud computing'],
    experienceYears: 3,
    englishLevel: 'avanzado',
    currentRole: 'Soporte TI',
    status: 'en_revision',
    score: 55,
    appliedDate: new Date('2026-07-20'),
  },
  {
    id: 'C005',
    firstName: 'María',
    lastName: 'Fernández',
    email: 'maria.fernandez@email.com',
    phone: '+34 656 789 012',
    skills: ['RRHH', 'selección de personal', 'evaluación desempeño'],
    experienceYears: 10,
    englishLevel: 'basico',
    currentRole: 'Recruitment Lead',
    status: 'contratado',
    score: 78,
    appliedDate: new Date('2026-06-15'),
  },
];

export const SAMPLE_TRAINING_PROGRAMS: TrainingProgram[] = [
  {
    id: 'T001',
    title: 'Liderazgo Transformacional',
    description: 'Programa para desarrollar habilidades de liderazgo en mandos medios.',
    category: 'liderazgo',
    durationHours: 40,
    modality: 'mixto',
    maxParticipants: 25,
    pricePerParticipant: 1200,
    status: 'activo',
    createdAt: new Date('2026-01-15'),
  },
  {
    id: 'T002',
    title: 'Comunicación Efectiva en Equipos Remotos',
    description: 'Taller práctico de comunicación para entornos distribuidos.',
    category: 'comunicacion',
    durationHours: 16,
    modality: 'online',
    maxParticipants: 30,
    pricePerParticipant: 600,
    status: 'activo',
    createdAt: new Date('2026-02-01'),
  },
  {
    id: 'T003',
    title: 'Gestión de Equipos de Alto Rendimiento',
    description: 'Metodologías ágiles y herramientas para líderes de equipo.',
    category: 'gestion_equipos',
    durationHours: 24,
    modality: 'presencial',
    maxParticipants: 20,
    pricePerParticipant: 900,
    status: 'activo',
    createdAt: new Date('2026-03-10'),
  },
  {
    id: 'T004',
    title: 'Inteligencia Emocional en el Trabajo',
    description: 'Desarrollo de habilidades blandas y autoconocimiento.',
    category: 'habilidades_blandas',
    durationHours: 12,
    modality: 'online',
    maxParticipants: 50,
    pricePerParticipant: 350,
    status: 'borrador',
    createdAt: new Date('2026-05-20'),
  },
  {
    id: 'T005',
    title: 'Fundamentos de IA para Managers',
    description: 'Introducción práctica a la inteligencia artificial aplicada.',
    category: 'tecnico',
    durationHours: 20,
    modality: 'online',
    maxParticipants: 40,
    pricePerParticipant: 750,
    status: 'activo',
    createdAt: new Date('2026-04-05'),
  },
];

export const SAMPLE_TICKETS: SupportTicket[] = [
  {
    id: 'ST001',
    clientId: 'CL001',
    agentId: 'AGT001',
    subject: 'Error al acceder al portal de candidatos',
    description: 'Los usuarios reportan error 500 al intentar iniciar sesión.',
    priority: 'alta',
    status: 'en_progreso',
    channel: 'email',
    sentiment: 'negativo',
    createdDate: new Date('2026-08-08T09:30:00'),
    slaDeadline: new Date('2026-08-09T09:30:00'),
  },
  {
    id: 'ST002',
    clientId: 'CL002',
    subject: 'Consulta sobre facturación del mes de julio',
    description: 'Necesitan copia de la factura con desglose de IVA.',
    priority: 'baja',
    status: 'abierto',
    channel: 'email',
    sentiment: 'neutro',
    createdDate: new Date('2026-08-09T11:00:00'),
    slaDeadline: new Date('2026-08-10T11:00:00'),
  },
  {
    id: 'ST003',
    clientId: 'CL003',
    agentId: 'AGT002',
    subject: 'Problema con integración de API',
    description: 'El endpoint de sincronización devuelve timeout.',
    priority: 'critica',
    status: 'abierto',
    channel: 'chat',
    sentiment: 'negativo',
    createdDate: new Date('2026-08-10T08:15:00'),
    slaDeadline: new Date('2026-08-10T20:15:00'),
  },
  {
    id: 'ST004',
    clientId: 'CL001',
    agentId: 'AGT001',
    subject: 'Solicitud de nuevo usuario administrador',
    description: 'Cliente solicita crear un usuario con permisos de admin.',
    priority: 'media',
    status: 'resuelto',
    channel: 'telefono',
    sentiment: 'positivo',
    createdDate: new Date('2026-08-07T14:00:00'),
    resolvedDate: new Date('2026-08-08T10:30:00'),
    slaDeadline: new Date('2026-08-08T14:00:00'),
  },
  {
    id: 'ST005',
    clientId: 'CL002',
    subject: 'Notificación de renovación de contrato',
    description: 'Cliente quiere confirmar los términos antes del vencimiento.',
    priority: 'media',
    status: 'cerrado',
    channel: 'email',
    sentiment: 'positivo',
    createdDate: new Date('2026-08-01T09:00:00'),
    resolvedDate: new Date('2026-08-03T16:00:00'),
    slaDeadline: new Date('2026-08-02T09:00:00'),
  },
];

export const SAMPLE_SALES_OPPORTUNITIES: SalesOpportunity[] = [
  {
    id: 'OP001',
    clientId: 'CL001',
    sdrId: 'SDR001',
    amount: 45000,
    stage: 'negociacion',
    probability: 75,
    createdAt: new Date('2026-06-01'),
    lastActivityDate: new Date('2026-08-09'),
    expectedCloseDate: new Date('2026-09-01'),
  },
  {
    id: 'OP002',
    clientId: 'CL002',
    sdrId: 'SDR002',
    amount: 28000,
    stage: 'propuesta',
    probability: 50,
    createdAt: new Date('2026-07-10'),
    lastActivityDate: new Date('2026-08-05'),
  },
  {
    id: 'OP003',
    clientId: 'CL003',
    sdrId: 'SDR001',
    amount: 60000,
    stage: 'prospeccion',
    probability: 15,
    createdAt: new Date('2026-08-01'),
    lastActivityDate: new Date('2026-08-01'),
  },
  {
    id: 'OP004',
    clientId: 'CL004',
    sdrId: 'SDR002',
    amount: 15000,
    stage: 'cerrado_ganado',
    probability: 100,
    createdAt: new Date('2026-05-01'),
    lastActivityDate: new Date('2026-07-15'),
    expectedCloseDate: new Date('2026-07-01'),
  },
  {
    id: 'OP005',
    clientId: 'CL001',
    sdrId: 'SDR001',
    amount: 32000,
    stage: 'cerrado_perdido',
    probability: 0,
    createdAt: new Date('2026-04-01'),
    lastActivityDate: new Date('2026-06-01'),
  },
];

export const SAMPLE_ENROLLMENTS: Enrollment[] = [
  {
    id: 'E001',
    programId: 'T001',
    clientId: 'CL001',
    participantName: 'Laura Gómez',
    participantEmail: 'laura.gomez@empresa1.com',
    enrolledDate: new Date('2026-07-01'),
    status: 'en_curso',
    progressPercent: 60,
  },
  {
    id: 'E002',
    programId: 'T001',
    clientId: 'CL001',
    participantName: 'Pedro Sánchez',
    participantEmail: 'pedro.sanchez@empresa1.com',
    enrolledDate: new Date('2026-07-01'),
    status: 'en_curso',
    progressPercent: 45,
  },
  {
    id: 'E003',
    programId: 'T002',
    clientId: 'CL002',
    participantName: 'Marta Ruiz',
    participantEmail: 'marta.ruiz@empresa2.com',
    enrolledDate: new Date('2026-07-15'),
    status: 'completado',
    completedDate: new Date('2026-08-05'),
    progressPercent: 100,
  },
  {
    id: 'E004',
    programId: 'T002',
    clientId: 'CL002',
    participantName: 'Jorge Díaz',
    participantEmail: 'jorge.diaz@empresa2.com',
    enrolledDate: new Date('2026-07-15'),
    status: 'abandonado',
    progressPercent: 30,
  },
  {
    id: 'E005',
    programId: 'T005',
    clientId: 'CL003',
    participantName: 'Sofía Torres',
    participantEmail: 'sofia.torres@empresa3.com',
    enrolledDate: new Date('2026-08-01'),
    status: 'inscrito',
    progressPercent: 0,
  },
];