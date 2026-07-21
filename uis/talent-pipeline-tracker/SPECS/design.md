# Especificaciones de Diseño y Arquitectura Técnica

## Stack Tecnológico
Para mantener el proyecto manejable, rápido y alineado con los requerimientos, utilizaremos tecnologías estándar sin depender de frameworks complejos de JavaScript:
- **Estructura**: HTML5 Semántico.
- **Estilos**: Tailwind CSS (uso exclusivo de clases utilitarias, sin CSS escrito a mano).
- **Interactividad**: JavaScript puro (Vanilla JS) para gestionar la validación del formulario.

## Principios de UI/UX
- **Mobile-First**: Construcción responsiva que se adapte perfectamente a móviles, tablets y pantallas de escritorio mediante los breakpoints de Tailwind.
- **Accesibilidad Web**: 
  - Uso de etiquetas semánticas (`<header>`, `<nav>`, `<section>`, `<fieldset>`, etc.).
  - Implementación de atributos ARIA (`aria-label`, `role`).
  - Uso obligatorio del atributo `alt` en todas las imágenes.

## Optimización y SEO
- **Schema.org**: Implementación de marcado estructurado de tipo `Organization` o `LocalBusiness` para asegurar que los motores de búsqueda indexen correctamente los datos corporativos de Nexova.

## Reglas del Formulario (`validation.js`)
- Agrupación lógica de campos utilizando `<fieldset>` y `<legend>`.
- **Validación Interactiva**: Revisión de campos en tiempo real (eventos `input` o `blur`).
- **Manejo de Errores**: Mensajes de error específicos, claros y estilizados para cada campo.
- Prevención del envío si existen errores, mostrando un mensaje de éxito simulado cuando todo esté correcto.