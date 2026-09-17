/**
 * Tests for validation utilities — business-rule validators for
 * Candidate, JobVacancy, TrainingProgram, Enrollment, SupportTicket,
 * SalesOpportunity, and Employee entities.
 *
 * Each validator is tested with:
 *  ✅ Happy path — fully valid objects
 *  🔸 Edge cases — boundary values, optional fields
 *  ❌ Failure modes — each rule violation
 */

import {
  validateCandidate,
  validateJobVacancy,
  validateTrainingProgram,
  validateEnrollment,
  validateSupportTicket,
  validateSalesOpportunity,
  validateEmployee,
  validateAll,
} from "../validations";
import type {
  Candidate,
  JobVacancy,
  TrainingProgram,
  Enrollment,
  SupportTicket,
  SalesOpportunity,
  Employee,
} from "../../types/models";

// ── Helpers ──

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "C-TEST",
    firstName: "Ana",
    lastName: "Pérez",
    email: "ana@example.com",
    phone: "+34 600 000 000",
    skills: ["JavaScript"],
    experienceYears: 5,
    englishLevel: "avanzado",
    currentRole: "Developer",
    status: "nuevo",
    score: 75,
    appliedDate: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeVacancy(overrides: Partial<JobVacancy> = {}): JobVacancy {
  return {
    id: "V-TEST",
    title: "Software Engineer",
    department: "tecnologia",
    clientId: "CL001",
    requiredSkills: ["JavaScript"],
    minExperience: 2,
    budget: 50000,
    status: "abierta",
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeProgram(overrides: Partial<TrainingProgram> = {}): TrainingProgram {
  return {
    id: "T-TEST",
    title: "Curso de Testing",
    description: "Aprende testing",
    category: "tecnico",
    durationHours: 20,
    modality: "online",
    maxParticipants: 30,
    pricePerParticipant: 500,
    status: "activo",
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeEnrollment(overrides: Partial<Enrollment> = {}): Enrollment {
  return {
    id: "E-TEST",
    programId: "T001",
    clientId: "CL001",
    participantName: "Juan Pérez",
    participantEmail: "juan@example.com",
    enrolledDate: new Date("2026-06-01"),
    status: "inscrito",
    progressPercent: 0,
    ...overrides,
  };
}

function makeTicket(overrides: Partial<SupportTicket> = {}): SupportTicket {
  const now = new Date();
  const later = new Date(now.getTime() + 3600000);
  return {
    id: "ST-TEST",
    clientId: "CL001",
    subject: "Error en el sistema",
    description: "Descripción del error",
    priority: "media",
    status: "abierto",
    channel: "email",
    sentiment: "neutro",
    createdDate: now,
    slaDeadline: later,
    ...overrides,
  };
}

function makeOpportunity(overrides: Partial<SalesOpportunity> = {}): SalesOpportunity {
  return {
    id: "OP-TEST",
    clientId: "CL001",
    sdrId: "SDR001",
    amount: 10000,
    stage: "prospeccion",
    probability: 30,
    createdAt: new Date("2026-01-01"),
    lastActivityDate: new Date("2026-06-01"),
    ...overrides,
  };
}

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "EMP-TEST",
    firstName: "Carlos",
    lastName: "López",
    email: "carlos@nexova.com",
    department: "tecnologia",
    position: "Developer",
    contractType: "indefinido",
    hireDate: new Date("2024-01-01"),
    salary: 45000,
    status: "activo",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════
// validateCandidate
// ═══════════════════════════════════════════════════════════════

describe("validateCandidate", () => {
  // ✅ Happy path
  test("returns valid for complete candidate", () => {
    const result = validateCandidate(makeCandidate());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // ❌ Failure — missing id
  test("rejects missing id", () => {
    const result = validateCandidate(makeCandidate({ id: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("El id del candidato es obligatorio");
  });

  // ❌ Failure — missing firstName
  test("rejects missing firstName", () => {
    const result = validateCandidate(makeCandidate({ firstName: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("El nombre del candidato es obligatorio");
  });

  // ❌ Failure — missing lastName
  test("rejects missing lastName", () => {
    const result = validateCandidate(makeCandidate({ lastName: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("El apellido del candidato es obligatorio");
  });

  // ❌ Failure — invalid email format
  test("rejects malformed email", () => {
    const result = validateCandidate(makeCandidate({ email: "not-an-email" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("formato"))).toBe(true);
  });

  // ❌ Failure — missing email
  test("rejects empty email", () => {
    const result = validateCandidate(makeCandidate({ email: "" }));
    expect(result.valid).toBe(false);
  });

  // ❌ Failure — negative experience
  test("rejects negative experienceYears", () => {
    const result = validateCandidate(makeCandidate({ experienceYears: -1 }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Los años de experiencia no pueden ser negativos"
    );
  });

  // 🔸 Edge — experienceYears = 0 (valid)
  test("accepts zero experienceYears", () => {
    const result = validateCandidate(makeCandidate({ experienceYears: 0 }));
    expect(result.valid).toBe(true);
  });

  // 🔸 Edge — experienceYears = 50 (valid boundary)
  test("accepts experienceYears = 50", () => {
    const result = validateCandidate(makeCandidate({ experienceYears: 50 }));
    expect(result.valid).toBe(true);
  });

  // ❌ Failure — experienceYears > 50
  test("rejects experienceYears > 50", () => {
    const result = validateCandidate(makeCandidate({ experienceYears: 51 }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Los años de experiencia no pueden superar 50"
    );
  });

  // ❌ Failure — score out of range (negative)
  test("rejects score < 0", () => {
    const result = validateCandidate(makeCandidate({ score: -1 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("0 y 100"))).toBe(true);
  });

  // ❌ Failure — score out of range (> 100)
  test("rejects score > 100", () => {
    const result = validateCandidate(makeCandidate({ score: 101 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("0 y 100"))).toBe(true);
  });

  // 🔸 Edge — score = 0 and 100 (boundaries)
  test("accepts score = 0", () => {
    expect(validateCandidate(makeCandidate({ score: 0 })).valid).toBe(true);
  });
  test("accepts score = 100", () => {
    expect(validateCandidate(makeCandidate({ score: 100 })).valid).toBe(true);
  });

  // ❌ Failure — null experienceYears triggers obligatorio
  test("rejects null experienceYears", () => {
    const result = validateCandidate(
      makeCandidate({ experienceYears: undefined as any })
    );
    expect(result.errors).toContain(
      "Los años de experiencia son obligatorios"
    );
  });

  // ❌ Failure — null score triggers obligatorio
  test("rejects null score", () => {
    const result = validateCandidate(
      makeCandidate({ score: undefined as any })
    );
    expect(result.errors).toContain(
      "El score del candidato es obligatorio"
    );
  });

  // ❌ Failure — invalid englishLevel
  test("rejects invalid englishLevel", () => {
    const result = validateCandidate(
      makeCandidate({ englishLevel: "fluent" as any })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("inglés"))).toBe(true);
  });

  // ❌ Failure — invalid status
  test("rejects invalid status", () => {
    const result = validateCandidate(
      makeCandidate({ status: "despedido" as any })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Estado"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// validateJobVacancy
// ═══════════════════════════════════════════════════════════════

describe("validateJobVacancy", () => {
  // ✅ Happy path
  test("returns valid for complete vacancy", () => {
    expect(validateJobVacancy(makeVacancy()).valid).toBe(true);
  });

  // ❌ Failure — missing id
  test("rejects missing id", () => {
    const result = validateJobVacancy(makeVacancy({ id: "" }));
    expect(result.errors).toContain("El id de la vacante es obligatorio");
  });

  // ❌ Failure — missing title
  test("rejects missing title", () => {
    const result = validateJobVacancy(makeVacancy({ title: "" }));
    expect(result.errors).toContain(
      "El título de la vacante es obligatorio"
    );
  });

  // ❌ Failure — missing clientId
  test("rejects missing clientId", () => {
    const result = validateJobVacancy(makeVacancy({ clientId: "" }));
    expect(result.errors).toContain("El cliente asociado es obligatorio");
  });

  // ❌ Failure — budget <= 0
  test("rejects zero budget", () => {
    const result = validateJobVacancy(makeVacancy({ budget: 0 }));
    expect(result.errors).toContain("El presupuesto debe ser un número positivo");
  });

  test("rejects negative budget", () => {
    const result = validateJobVacancy(makeVacancy({ budget: -100 }));
    expect(result.errors).toContain("El presupuesto debe ser un número positivo");
  });

  // ❌ Failure — negative minExperience
  test("rejects negative minExperience", () => {
    const result = validateJobVacancy(makeVacancy({ minExperience: -1 }));
    expect(result.errors).toContain(
      "La experiencia mínima no puede ser negativa"
    );
  });

  // 🔸 Edge — minExperience = 0 (valid)
  test("accepts minExperience = 0", () => {
    const result = validateJobVacancy(makeVacancy({ minExperience: 0 }));
    expect(result.valid).toBe(true);
  });

  // ❌ Failure — maxExperience <= minExperience
  test("rejects maxExperience <= minExperience", () => {
    const result = validateJobVacancy(
      makeVacancy({ minExperience: 3, maxExperience: 2 })
    );
    expect(result.errors).toContain(
      "La experiencia máxima debe ser mayor que la experiencia mínima"
    );
  });

  // 🔸 Edge — maxExperience > minExperience (valid)
  test("accepts maxExperience > minExperience", () => {
    const result = validateJobVacancy(
      makeVacancy({ minExperience: 2, maxExperience: 5 })
    );
    expect(result.valid).toBe(true);
  });

  // ❌ Failure — null budget triggers obligatorio
  test("rejects null budget", () => {
    const result = validateJobVacancy(
      makeVacancy({ budget: undefined as any })
    );
    expect(result.errors).toContain("El presupuesto es obligatorio");
  });

  // ❌ Failure — null minExperience triggers obligatorio
  test("rejects null minExperience", () => {
    const result = validateJobVacancy(
      makeVacancy({ minExperience: undefined as any })
    );
    expect(result.errors).toContain(
      "La experiencia mínima es obligatoria"
    );
  });

  // ❌ Failure — invalid status
  test("rejects invalid status", () => {
    const result = validateJobVacancy(
      makeVacancy({ status: "pendiente" as any })
    );
    expect(result.errors.some((e) => e.includes("Estado de vacante"))).toBe(
      true
    );
  });

  // ❌ Failure — closedAt before createdAt
  test("rejects closedAt before createdAt", () => {
    const result = validateJobVacancy(
      makeVacancy({
        createdAt: new Date("2026-06-01"),
        closedAt: new Date("2026-05-01"),
      })
    );
    expect(result.errors).toContain(
      "La fecha de cierre no puede ser anterior a la fecha de creación"
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// validateTrainingProgram
// ═══════════════════════════════════════════════════════════════

describe("validateTrainingProgram", () => {
  // ✅ Happy path
  test("returns valid for complete program", () => {
    expect(validateTrainingProgram(makeProgram()).valid).toBe(true);
  });

  // ❌ Failure — missing id
  test("rejects missing id", () => {
    expect(
      validateTrainingProgram(makeProgram({ id: "" })).errors
    ).toContain("El id del programa es obligatorio");
  });

  // ❌ Failure — missing title
  test("rejects missing title", () => {
    const result = validateTrainingProgram(makeProgram({ title: "" }));
    expect(result.errors).toContain("El título del programa es obligatorio");
  });

  // ❌ Failure — duration <= 0
  test("rejects zero duration", () => {
    expect(
      validateTrainingProgram(makeProgram({ durationHours: 0 })).valid
    ).toBe(false);
  });

  test("rejects negative duration", () => {
    expect(
      validateTrainingProgram(makeProgram({ durationHours: -5 })).valid
    ).toBe(false);
  });

  // 🔸 Edge — duration = 1000 (boundary accept)
  test("accepts durationHours = 1", () => {
    expect(
      validateTrainingProgram(makeProgram({ durationHours: 1 })).valid
    ).toBe(true);
  });

  // ❌ Failure — duration > 1000
  test("rejects duration > 1000", () => {
    const result = validateTrainingProgram(makeProgram({ durationHours: 1001 }));
    expect(result.errors).toContain(
      "La duración no puede superar las 1000 horas"
    );
  });

  // ❌ Failure — maxParticipants <= 0
  test("rejects zero maxParticipants", () => {
    expect(
      validateTrainingProgram(makeProgram({ maxParticipants: 0 })).valid
    ).toBe(false);
  });

  // ❌ Failure — negative price
  test("rejects negative price", () => {
    const result = validateTrainingProgram(
      makeProgram({ pricePerParticipant: -1 })
    );
    expect(result.errors).toContain(
      "El precio por participante no puede ser negativo"
    );
  });

  // 🔸 Edge — price = 0 (valid)
  test("accepts price = 0 (free program)", () => {
    expect(
      validateTrainingProgram(makeProgram({ pricePerParticipant: 0 })).valid
    ).toBe(true);
  });

  // ❌ Failure — null durationHours triggers obligatorio
  test("rejects null durationHours", () => {
    const result = validateTrainingProgram(
      makeProgram({ durationHours: undefined as any })
    );
    expect(result.errors).toContain(
      "La duración en horas es obligatoria"
    );
  });

  // ❌ Failure — null maxParticipants triggers obligatorio
  test("rejects null maxParticipants", () => {
    const result = validateTrainingProgram(
      makeProgram({ maxParticipants: undefined as any })
    );
    expect(result.errors).toContain(
      "El máximo de participantes es obligatorio"
    );
  });

  // ❌ Failure — null price triggers obligatorio
  test("rejects null pricePerParticipant", () => {
    const result = validateTrainingProgram(
      makeProgram({ pricePerParticipant: undefined as any })
    );
    expect(result.errors).toContain(
      "El precio por participante es obligatorio"
    );
  });

  // ❌ Failure — invalid modality
  test("rejects invalid modality", () => {
    const result = validateTrainingProgram(
      makeProgram({ modality: "virtual" as any })
    );
    expect(result.errors.some((e) => e.includes("Modalidad"))).toBe(true);
  });

  // ❌ Failure — invalid category
  test("rejects invalid category", () => {
    const result = validateTrainingProgram(
      makeProgram({ category: "deportes" as any })
    );
    expect(result.errors.some((e) => e.includes("Categoría"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// validateEnrollment
// ═══════════════════════════════════════════════════════════════

describe("validateEnrollment", () => {
  // ✅ Happy path
  test("returns valid for complete enrollment", () => {
    expect(validateEnrollment(makeEnrollment()).valid).toBe(true);
  });

  // ❌ Failure — missing id
  test("rejects missing id", () => {
    expect(
      validateEnrollment(makeEnrollment({ id: "" })).errors
    ).toContain("El id de la inscripción es obligatorio");
  });

  // ❌ Failure — missing programId
  test("rejects missing programId", () => {
    expect(
      validateEnrollment(makeEnrollment({ programId: "" })).errors
    ).toContain("El programa es obligatorio");
  });

  // ❌ Failure — missing participantName
  test("rejects missing participantName", () => {
    const result = validateEnrollment(
      makeEnrollment({ participantName: "" })
    );
    expect(result.errors).toContain(
      "El nombre del participante es obligatorio"
    );
  });

  // ❌ Failure — progressPercent out of range
  test("rejects progressPercent < 0", () => {
    expect(
      validateEnrollment(makeEnrollment({ progressPercent: -1 })).valid
    ).toBe(false);
  });

  test("rejects progressPercent > 100", () => {
    expect(
      validateEnrollment(makeEnrollment({ progressPercent: 101 })).valid
    ).toBe(false);
  });

  // 🔸 Edge — progressPercent = 0 and 100 (boundaries)
  test("accepts progressPercent = 0", () => {
    expect(
      validateEnrollment(makeEnrollment({ progressPercent: 0 })).valid
    ).toBe(true);
  });

  test("accepts progressPercent = 100", () => {
    expect(
      validateEnrollment(makeEnrollment({ progressPercent: 100 })).valid
    ).toBe(true);
  });

  // ❌ Failure — completed without completedDate
  test("rejects completed status without completedDate", () => {
    const result = validateEnrollment(
      makeEnrollment({
        status: "completado",
        progressPercent: 100,
        completedDate: undefined,
      })
    );
    expect(result.errors).toContain(
      "Una inscripción completada debe tener una fecha de finalización"
    );
  });

  // ✅ Completed with completedDate is valid
  test("accepts completed with completedDate", () => {
    expect(
      validateEnrollment(
        makeEnrollment({
          status: "completado",
          progressPercent: 100,
          completedDate: new Date("2026-07-01"),
        })
      ).valid
    ).toBe(true);
  });

  // ❌ Failure — null progressPercent triggers obligatorio
  test("rejects null progressPercent", () => {
    const result = validateEnrollment(
      makeEnrollment({ progressPercent: undefined as any })
    );
    expect(result.errors).toContain("El progreso es obligatorio");
  });

  // ❌ Failure — future enrolledDate is rejected
  test("rejects future enrolledDate", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = validateEnrollment(
      makeEnrollment({ enrolledDate: future })
    );
    expect(result.errors).toContain(
      "La fecha de inscripción no puede ser futura"
    );
  });

  // ❌ Failure — invalid status
  test("rejects invalid status", () => {
    const result = validateEnrollment(
      makeEnrollment({ status: "suspendido" as any })
    );
    expect(result.errors.some((e) => e.includes("Estado de inscripción"))).toBe(
      true
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// validateSupportTicket
// ═══════════════════════════════════════════════════════════════

describe("validateSupportTicket", () => {
  // ✅ Happy path
  test("returns valid for complete ticket", () => {
    expect(validateSupportTicket(makeTicket()).valid).toBe(true);
  });

  // ❌ Failure — missing id
  test("rejects missing id", () => {
    expect(
      validateSupportTicket(makeTicket({ id: "" })).errors
    ).toContain("El id del ticket es obligatorio");
  });

  // ❌ Failure — missing clientId
  test("rejects missing clientId", () => {
    expect(
      validateSupportTicket(makeTicket({ clientId: "" })).errors
    ).toContain("El cliente es obligatorio");
  });

  // ❌ Failure — missing subject
  test("rejects missing subject", () => {
    const result = validateSupportTicket(makeTicket({ subject: "" }));
    expect(result.errors).toContain("El asunto del ticket es obligatorio");
  });

  // ❌ Failure — invalid priority
  test("rejects invalid priority", () => {
    const result = validateSupportTicket(
      makeTicket({ priority: "urgente" as any })
    );
    expect(result.errors.some((e) => e.includes("Prioridad"))).toBe(true);
  });

  // ❌ Failure — invalid status
  test("rejects invalid status", () => {
    const result = validateSupportTicket(
      makeTicket({ status: "cancelado" as any })
    );
    expect(result.errors.some((e) => e.includes("Estado de ticket"))).toBe(
      true
    );
  });

  // ❌ Failure — invalid channel
  test("rejects invalid channel", () => {
    const result = validateSupportTicket(
      makeTicket({ channel: "whatsapp" as any })
    );
    expect(result.errors.some((e) => e.includes("Canal"))).toBe(true);
  });

  // ❌ Failure — slaDeadline <= createdDate
  test("rejects slaDeadline <= createdDate", () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 3600000);
    const result = validateSupportTicket(
      makeTicket({ createdDate: now, slaDeadline: earlier })
    );
    expect(result.errors).toContain(
      "El SLA deadline debe ser posterior a la fecha de creación"
    );
  });

  // ❌ Failure — resolved ticket with resolvedDate before creation
  test("rejects resolved date before created date", () => {
    const created = new Date("2026-06-02");
    const resolved = new Date("2026-06-01");
    const sla = new Date("2026-06-03");
    const result = validateSupportTicket(
      makeTicket({
        status: "resuelto",
        createdDate: created,
        resolvedDate: resolved,
        slaDeadline: sla,
      })
    );
    expect(result.errors).toContain(
      "La fecha de resolución no puede ser anterior a la fecha de creación"
    );
  });

  // 🔸 Edge — optional fields (agentId, resolvedDate) omitted is valid
  test("accepts ticket without agentId", () => {
    const result = validateSupportTicket(makeTicket({ agentId: undefined }));
    expect(result.valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// validateSalesOpportunity
// ═══════════════════════════════════════════════════════════════

describe("validateSalesOpportunity", () => {
  // ✅ Happy path
  test("returns valid for complete opportunity", () => {
    expect(validateSalesOpportunity(makeOpportunity()).valid).toBe(true);
  });

  // ❌ Failure — missing id
  test("rejects missing id", () => {
    expect(
      validateSalesOpportunity(makeOpportunity({ id: "" })).errors
    ).toContain("El id de la oportunidad es obligatorio");
  });

  // ❌ Failure — missing clientId
  test("rejects missing clientId", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({ clientId: "" })
    );
    expect(result.errors).toContain("El cliente es obligatorio");
  });

  // ❌ Failure — null amount triggers obligatorio
  test("rejects null amount", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({ amount: undefined as any })
    );
    expect(result.errors).toContain("El monto es obligatorio");
  });

  // ❌ Failure — null probability triggers obligatorio
  test("rejects null probability", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({ probability: undefined as any })
    );
    expect(result.errors).toContain(
      "La probabilidad es obligatoria"
    );
  });

  // ❌ Failure — expectedCloseDate before createdAt
  test("rejects expectedCloseDate before createdAt", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({
        expectedCloseDate: new Date("2025-12-01"),
        createdAt: new Date("2026-01-01"),
      })
    );
    expect(result.errors).toContain(
      "La fecha de cierre esperada no puede ser anterior a la fecha de creación"
    );
  });

  // ❌ Failure — amount <= 0
  test("rejects zero amount", () => {
    expect(
      validateSalesOpportunity(makeOpportunity({ amount: 0 })).valid
    ).toBe(false);
  });

  test("rejects negative amount", () => {
    expect(
      validateSalesOpportunity(makeOpportunity({ amount: -100 })).valid
    ).toBe(false);
  });

  // ❌ Failure — probability out of range
  test("rejects probability < 0", () => {
    expect(
      validateSalesOpportunity(makeOpportunity({ probability: -1 })).valid
    ).toBe(false);
  });

  test("rejects probability > 100", () => {
    expect(
      validateSalesOpportunity(makeOpportunity({ probability: 101 })).valid
    ).toBe(false);
  });

  // 🔸 Edge — probability = 0 and 100 (boundaries)
  test("accepts probability = 0", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({ probability: 0, stage: "prospeccion" })
    );
    expect(result.valid).toBe(true);
  });

  test("accepts probability = 100", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({ probability: 100 })
    );
    // probability=100 without closed-won is valid at schema level
    expect(result.valid).toBe(true);
  });

  // ❌ Failure — invalid stage
  test("rejects invalid stage", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({ stage: "perdido" as any })
    );
    expect(result.errors.some((e) => e.includes("Etapa"))).toBe(true);
  });

  // ❌ Failure — closed-won without probability 100
  test("rejects closed-won with probability != 100", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({ stage: "cerrado_ganado", probability: 50 })
    );
    expect(result.errors).toContain(
      "Una oportunidad cerrada-ganada debe tener probabilidad 100"
    );
  });

  // ❌ Failure — closed-lost without probability 0
  test("rejects closed-lost with probability != 0", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({ stage: "cerrado_perdido", probability: 10 })
    );
    expect(result.errors).toContain(
      "Una oportunidad cerrada-perdida debe tener probabilidad 0"
    );
  });

  // ✅ Stage consistency — closed-won + prob 100
  test("accepts closed-won with probability 100", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({ stage: "cerrado_ganado", probability: 100 })
    );
    expect(result.valid).toBe(true);
  });

  // ✅ Stage consistency — closed-lost + prob 0
  test("accepts closed-lost with probability 0", () => {
    const result = validateSalesOpportunity(
      makeOpportunity({ stage: "cerrado_perdido", probability: 0 })
    );
    expect(result.valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// validateEmployee
// ═══════════════════════════════════════════════════════════════

describe("validateEmployee", () => {
  // ✅ Happy path
  test("returns valid for complete employee", () => {
    expect(validateEmployee(makeEmployee()).valid).toBe(true);
  });

  // ❌ Failure — missing id
  test("rejects missing id", () => {
    expect(validateEmployee(makeEmployee({ id: "" })).errors).toContain(
      "El id del empleado es obligatorio"
    );
  });

  // ❌ Failure — missing firstName
  test("rejects missing firstName", () => {
    const result = validateEmployee(makeEmployee({ firstName: "" }));
    expect(result.errors).toContain("El nombre del empleado es obligatorio");
  });

  // ❌ Failure — missing lastName
  test("rejects missing lastName", () => {
    const result = validateEmployee(makeEmployee({ lastName: "" }));
    expect(result.errors).toContain("El apellido del empleado es obligatorio");
  });

  // ❌ Failure — missing email
  test("rejects missing email", () => {
    const result = validateEmployee(makeEmployee({ email: "" }));
    expect(result.errors).toContain("El email del empleado es obligatorio");
  });

  // ❌ Failure — missing position
  test("rejects missing position", () => {
    const result = validateEmployee(makeEmployee({ position: "" }));
    expect(result.errors).toContain("El cargo del empleado es obligatorio");
  });

  // ❌ Failure — null salary triggers obligatorio
  test("rejects null salary", () => {
    const result = validateEmployee(
      makeEmployee({ salary: undefined as any })
    );
    expect(result.errors).toContain("El salario es obligatorio");
  });

  // ❌ Failure — salary <= 0
  test("rejects zero salary", () => {
    expect(validateEmployee(makeEmployee({ salary: 0 })).valid).toBe(false);
  });

  test("rejects negative salary", () => {
    expect(validateEmployee(makeEmployee({ salary: -100 })).valid).toBe(false);
  });

  // 🔸 Edge — future hireDate is rejected
  test("rejects future hireDate", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = validateEmployee(
      makeEmployee({ hireDate: future })
    );
    expect(result.errors).toContain(
      "La fecha de contratación no puede ser futura"
    );
  });

  // ❌ Failure — invalid contractType
  test("rejects invalid contractType", () => {
    const result = validateEmployee(
      makeEmployee({ contractType: "por_horas" as any })
    );
    expect(result.errors.some((e) => e.includes("Tipo de contrato"))).toBe(
      true
    );
  });

  // ❌ Failure — invalid status
  test("rejects invalid status", () => {
    const result = validateEmployee(
      makeEmployee({ status: "jubilado" as any })
    );
    expect(result.errors.some((e) => e.includes("Estado de empleado"))).toBe(
      true
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// validateAll (combinator)
// ═══════════════════════════════════════════════════════════════

describe("validateAll", () => {
  test("returns valid when all validators pass", () => {
    const result = validateAll([
      () => validateCandidate(makeCandidate()),
      () => validateEmployee(makeEmployee()),
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("collects errors from all failing validators", () => {
    const result = validateAll([
      () => validateCandidate(makeCandidate({ id: "" })),
      () => validateEmployee(makeEmployee({ salary: 0 })),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    expect(result.errors).toContain("El id del candidato es obligatorio");
    expect(result.errors).toContain("El salario debe ser un número positivo");
  });

  test("returns empty errors for empty validators array", () => {
    const result = validateAll([]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});