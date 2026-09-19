/**
 * Nexova – Talent Form Validation
 * Validates all fields in real-time (on blur and while typing)
 * and prevents submission if errors exist.
 * Implements exact error messages and validation rules per the spec.
 */

(function () {
  'use strict';

  const form = document.getElementById('talent-form');
  if (!form) return;

  // ===== RULES =====
  const rules = {
    fullName: {
      validate(value) {
        if (!value.trim()) return 'El nombre debe contener al menos nombre y apellido';
        const words = value.trim().split(/\s+/);
        if (words.length < 2) return 'El nombre debe contener al menos nombre y apellido';
        return '';
      }
    },
    email: {
      validate(value) {
        if (!value.trim()) return 'Ingresa un email válido (ejemplo: nombre@empresa.com)';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Ingresa un email válido (ejemplo: nombre@empresa.com)';
        return '';
      }
    },
    phone: {
      validate(value) {
        if (!value.trim()) return 'El teléfono debe incluir código de país (ejemplo: +34 612 345 678)';
        if (!/^\+/.test(value.trim())) return 'El teléfono debe incluir código de país (ejemplo: +34 612 345 678)';
        return '';
      }
    },
    country: {
      validate(value) {
        if (!value) return 'Selecciona tu país de residencia';
        return '';
      }
    },
    experience: {
      validate(value) {
        if (value === '') return 'Los años de experiencia deben estar entre 0 y 50';
        const num = Number(value);
        if (!Number.isInteger(num) || num < 0 || num > 50) return 'Los años de experiencia deben estar entre 0 y 50';
        return '';
      }
    },
    sector: {
      validate(value) {
        if (!value) return 'Selecciona el sector de tu interés';
        return '';
      }
    },
    englishLevel: {
      validate(value) {
        if (!value) return 'Indica tu nivel de inglés';
        return '';
      }
    },
    availability: {
      validate(value) {
        if (!value) return 'Selecciona tu disponibilidad';
        return '';
      }
    },
    linkedin: {
      validate(value) {
        if (!value.trim()) return ''; // optional field
        if (!/^https?:\/\//.test(value.trim())) return 'Si incluyes LinkedIn, debe ser una URL válida';
        return '';
      }
    },
    comments: {
      validate(value) {
        if (value.length > 500) {
          return 'Los comentarios no pueden exceder 500 caracteres';
        }
        return '';
      }
    },
    privacy: {
      validate(checked) {
        if (!checked) return 'Debes aceptar la política de tratamiento de datos para continuar';
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
    // Handle radio buttons separately
    if (fieldId === 'availability') {
      const radios = document.querySelectorAll('input[name="availability"]');
      radios.forEach(r => {
        r.classList.add('border-red-500');
      });
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
    // Handle radio buttons separately
    if (fieldId === 'availability') {
      const radios = document.querySelectorAll('input[name="availability"]');
      radios.forEach(r => {
        r.classList.remove('border-red-500');
      });
    }
  }

  function getFieldValue(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) {
      // For radio buttons, check by name
      if (fieldId === 'availability') {
        const checked = document.querySelector('input[name="availability"]:checked');
        return checked ? checked.value : '';
      }
      return '';
    }
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'radio') {
      const name = el.name;
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : '';
    }
    return el.value;
  }

  function validateField(fieldId) {
    const rule = rules[fieldId];
    if (!rule) return true;

    const value = getFieldValue(fieldId);
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
  for (const fieldId in rules) {
    // For availability (radio), attach to each radio button
    if (fieldId === 'availability') {
      const radios = document.querySelectorAll('input[name="availability"]');
      radios.forEach(radio => {
        radio.addEventListener('change', function () {
          validateField('availability');
        });
      });
      continue;
    }

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