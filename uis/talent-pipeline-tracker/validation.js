/**
 * Nexova Solutions – Form Validation
 * Validates all fields in real-time (on blur and while typing)
 * and prevents submission if errors exist.
 */

(function () {
  'use strict';

  const form = document.getElementById('application-form');
  if (!form) return;

  // ===== RULES =====
  const rules = {
    fullName: {
      validate(value) {
        if (!value.trim()) return 'El nombre completo es obligatorio.';
        if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
        if (!/^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s'-]+$/.test(value.trim())) return 'El nombre solo puede contener letras y espacios.';
        return '';
      }
    },
    email: {
      validate(value) {
        if (!value.trim()) return 'El correo electrónico es obligatorio.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Introduce un correo electrónico válido.';
        return '';
      }
    },
    phone: {
      validate(value) {
        if (!value.trim()) return 'El teléfono es obligatorio.';
        const cleaned = value.replace(/[\s\-().+]/g, '');
        if (!/^\d{7,15}$/.test(cleaned)) return 'Introduce un número de teléfono válido (7-15 dígitos).';
        return '';
      }
    },
    birthdate: {
      validate(value) {
        if (!value) return 'La fecha de nacimiento es obligatoria.';
        const date = new Date(value);
        const now = new Date();
        const age = (now - date) / (1000 * 60 * 60 * 24 * 365.25);
        if (age < 16) return 'Debes tener al menos 16 años para aplicar.';
        if (age > 75) return 'La fecha ingresada no parece correcta.';
        return '';
      }
    },
    city: {
      validate(value) {
        if (!value.trim()) return 'La ciudad es obligatoria.';
        if (value.trim().length < 2) return 'Introduce el nombre de tu ciudad.';
        return '';
      }
    },
    area: {
      validate(value) {
        if (!value) return 'Selecciona un área de interés.';
        return '';
      }
    },
    experience: {
      validate(value) {
        if (value === '') return 'Los años de experiencia son obligatorios.';
        const num = Number(value);
        if (!Number.isInteger(num) || num < 0) return 'Introduce un número válido.';
        if (num > 50) return 'El número de años no puede superar 50.';
        return '';
      }
    },
    availability: {
      validate(value) {
        if (!value) return 'Selecciona tu disponibilidad.';
        return '';
      }
    },
    coverLetter: {
      validate(value) {
        if (!value.trim()) return 'La carta de motivación es obligatoria.';
        if (value.trim().length < 50) return `Debes escribir al menos 50 caracteres. Actualmente tienes ${value.trim().length}.`;
        return '';
      }
    },
    privacy: {
      validate(checked) {
        if (!checked) return 'Debes aceptar la política de privacidad para continuar.';
        return '';
      }
    }
  };

  // ===== HELPERS =====
  function showError(fieldId, message) {
    const errorEl = document.getElementById('error-' + fieldId);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
    if (inputEl) {
      inputEl.classList.add('border-red-500');
      inputEl.classList.add('bg-red-50');
      inputEl.setAttribute('aria-invalid', 'true');
    }
  }

  function clearError(fieldId) {
    const errorEl = document.getElementById('error-' + fieldId);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
    if (inputEl) {
      inputEl.classList.remove('border-red-500');
      inputEl.classList.remove('bg-red-50');
      inputEl.removeAttribute('aria-invalid');
    }
  }

  function validateField(fieldId) {
    const inputEl = document.getElementById(fieldId);
    const rule = rules[fieldId];
    if (!inputEl || !rule) return true;

    let value;
    if (inputEl.type === 'checkbox') {
      value = inputEl.checked;
    } else {
      value = inputEl.value;
    }

    const error = rule.validate(value);
    if (error) {
      showError(fieldId, error);
      return false;
    } else {
      clearError(fieldId);
      return true;
    }
  }

  function validateAll() {
    let allValid = true;
    for (const fieldId in rules) {
      if (!validateField(fieldId)) {
        allValid = false;
      }
    }
    return allValid;
  }

  // ===== EVENT LISTENERS =====
  // Real-time validation: on blur
  for (const fieldId in rules) {
    const el = document.getElementById(fieldId);
    if (!el) continue;

    // Validate on blur
    el.addEventListener('blur', function () {
      validateField(fieldId);
    });

    // Validate on input (only if already showing an error)
    el.addEventListener('input', function () {
      const errorEl = document.getElementById('error-' + fieldId);
      if (errorEl && !errorEl.classList.contains('hidden')) {
        validateField(fieldId);
      }
    });
  }

  // ===== FORM SUBMISSION =====
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const isValid = validateAll();

    if (!isValid) {
      // Scroll to first error
      const firstError = form.querySelector('[aria-invalid="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }

    // Simulate successful submission
    form.classList.add('hidden');
    const successMessage = document.getElementById('success-message');
    successMessage.classList.remove('hidden');
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();