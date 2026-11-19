# Project Brief — Nexova Solutions

> Fuente de verdad del negocio: [`BRIEFING.md`](../BRIEFING.md). Este archivo lo resume para el agente; si hay contradicción, manda `BRIEFING.md`.

## La empresa

**Nexova Solutions** es una consultora de RR. HH. y selección de talento (fundada en 2011, sede en Valencia y oficina en Miami, 120 empleados, ~8 M USD/año). Tiene tres líneas de negocio:

1. **Headhunting** de mandos medios y directivos (núcleo del negocio).
2. **Outsourcing de soporte al cliente** para empresas de tecnología, retail y finanzas.
3. **Formación corporativa** en habilidades blandas y liderazgo.

Sus clientes son medianas empresas B2B. Los usuarios del sistema son equipos profesionales, no consumidores anónimos.

## El problema

Nexova opera con herramientas desconectadas (HubSpot, un Zendesk legacy, un ATS interno de 2010, Google Workspace y hojas de cálculo). Consecuencias:

| Área | Responsable | Dolor principal |
|---|---|---|
| Operaciones de Selección | Javier Almeida (40 consultores) | Criba manual de 30–80 CV por proceso; los clientes no ven el estado de los candidatos |
| Formación Corporativa | Elena Vargas (12) | El catálogo es un PDF; las inscripciones van por Google Form y hoja de cálculo |
| Soporte al Cliente | Roberto Díaz (30 agentes) | Resolución media de 48 h frente a un SLA de 24 h; sin base de conocimiento |
| Ventas | Equipo de 18 (AM + SDR) | CRM poco usado y deals perdidos por falta de seguimiento |
| Marketing | Carmen Ruiz | Web de 2019, lenta, no accesible y sin medición de conversión |
| RR. HH. interno | Patricia Solís | Vacaciones, onboarding y evaluaciones por email y hojas de cálculo |
| Tecnología | CTO Sergio Molina (6) | Sin telemetría, logging centralizado ni despliegues automáticos |
| Dirección | CEO Laura Mendoza | Informe semanal en PDF hecho a mano, con datos de hace una semana |

## Objetivo del proyecto

Construir, dentro de **un único monorepo**, la plataforma que centralice los departamentos de Nexova y ponga la IA en el núcleo de la operación:

- **Sitio público** (`uis/website`): web corporativa moderna, con SEO, schema.org y captación de candidatos y clientes.
- **Backoffice interno** (`uis/backoffice`): talent pipeline, gestión de incidencias, catálogo de formación e inventario, y autenticación.
- **API central** (`services/backend`): FastAPI que da servicio a ambos frontends.
- **Hitos posteriores:** telemetría, pipeline de datos, RAG sobre candidatos y base de conocimiento, agentes (soporte, formación, RR. HH.), workflows con n8n y dashboards en tiempo real.

## Prioridades elegidas (ver `company-choice.md`)

- Centralizar los 5 departamentos (Operaciones, Ventas, RR. HH., Formación y Soporte) mediante APIs comunes.
- Módulo de candidatos con el estado de la postulación en tiempo real.
- Módulo de formación con catálogo, búsqueda, recomendación y área del alumno.
- Módulo de RR. HH. con onboarding por checklists.
- Capa de datos e IA: scoring de CV, búsqueda semántica de candidatos, chatbots y análisis de sentimiento.

## Criterios de éxito del negocio

- Los consultores dejan de cribar CV a mano: scoring y ranking explicables.
- Los clientes ven el estado de sus procesos sin tener que llamar.
- Soporte vuelve a cumplir el SLA de 24 h, con un chatbot que resuelve ~40 % de las consultas.
- La dirección tiene KPIs en tiempo real en lugar del PDF semanal.
