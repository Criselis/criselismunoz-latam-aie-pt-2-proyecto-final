/* Entry point para el navegador, se importa todas las utilidades 
y las expone al ámbito global para que la página HTML pueda usarlas.*/

// -- Modelos y datos de ejemplo --
import {
  SAMPLE_CANDIDATES,
  SAMPLE_TRAINING_PROGRAMS,
  SAMPLE_TICKETS,
  SAMPLE_SALES_OPPORTUNITIES,
  SAMPLE_ENROLLMENTS,
} from './types/models';

// -- Colecciones --
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

// -- Búsqueda --
import {
  linearSearch,
  binarySearch,
  smartSearch,
  isSorted,
} from './utils/search';

// -- Transformaciones --
import {
  numericSummary,
  sumBy,
  averageBy,
  maxBy,
  minBy,
  countByCategory,
  categoryDistribution,
} from './utils/transformations';

// -- Validaciones --
import {
  validateCandidate,
  validateTrainingProgram,
  validateEnrollment,
  validateSupportTicket,
  validateSalesOpportunity,
  validateEmployee,
} from './utils/validations';

// ============================================================
// Exposición global para uso desde index.html
// ============================================================

(window as any).Nexova = {
  // Datos de ejemplo
  SAMPLE_CANDIDATES,
  SAMPLE_TRAINING_PROGRAMS,
  SAMPLE_TICKETS,
  SAMPLE_SALES_OPPORTUNITIES,
  SAMPLE_ENROLLMENTS,

  // Colecciones
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

  // Búsqueda
  linearSearch,
  binarySearch,
  smartSearch,
  isSorted,

  // Transformaciones
  numericSummary,
  sumBy,
  averageBy,
  maxBy,
  minBy,
  countByCategory,
  categoryDistribution,

  // Validaciones
  validateCandidate,
  validateTrainingProgram,
  validateEnrollment,
  validateSupportTicket,
  validateSalesOpportunity,
  validateEmployee,
};

