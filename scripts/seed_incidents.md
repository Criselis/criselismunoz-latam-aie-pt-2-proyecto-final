# Seed Incidencias desde CSV Histórico

## Descripción

`scripts/seed_incidents.py` carga datos históricos de incidencias desde un archivo CSV (`data/raw/incidents_historical.csv`) hacia la base de datos TinyDB de la aplicación.

El script:
- **Transforma** campos del CSV según mapeos predefinidos (estado → status, categoría → category, ubicación → branch)
- **Valida** cada registro contra el esquema Pydantic antes de insertar
- **Asigna origen** "customer" a todos los registros
- **Es idempotente**: ejecutado N veces, no duplica registros
- **Reporta errores** de forma legible, sin stack traces

## Mapeos de Transformación

| Campo CSV | Campo Modelo | Mapeo |
|-----------|--------------|-------|
| `estado` | `status` | abierto → open, en_progreso → in_progress, resuelto → resolved, descartado → discarded |
| `categoría` | `category` | operaciones_selección → recruitment_operations, formación_corporativa → corporate_training, etc. |
| `ubicación` | `branch` | central, valencia, miami |
| `descripción` | `description` | Se usa como-está (validación: no vacío) |
| `descripción` | `title` | Primera oración o primeras N palabras (máx 140 caracteres) |
| `fecha` | `created_at` | Se asigna tal cual (ISO format) |
| (fijo) | `origin` | Siempre: "customer" |

## Estructura del CSV

```csv
id,estado,categoría,descripción,fecha,ubicación
1,resuelto,soporte_cliente,"Descripción de la incidencia",2026-08-15T10:30:00,central
2,abierto,operaciones_selección,"Descripción",2026-08-17T14:22:00,valencia
...
```

**Campos requeridos:**
- `estado`: abierto, en_progreso, resuelto, descartado
- `categoría`: operaciones_selección, formación_corporativa, soporte_cliente, ventas_desarrollo_negocio, marketing_comunicaciones, recursos_humanos, tecnología_infraestructura, dirección_ejecutiva
- `descripción`: texto no vacío (se convierte a título + descripción)
- `fecha`: ISO datetime string
- `ubicación`: central, valencia, miami

## Uso

### Ejecución estándar (inserta datos)
```bash
cd /path/to/repo
source .venv/bin/activate
python scripts/seed_incidents.py
```

### Validación sin insertar (dry-run)
```bash
python scripts/seed_incidents.py --dry-run
```

### CSV personalizado
```bash
python scripts/seed_incidents.py --csv-path /path/to/my_incidents.csv
```

## Salida

```
======================================================================
SEED INCIDENTS FROM CSV
======================================================================
CSV: /workspaces/.../data/raw/incidents_historical.csv
Dry-run: False

  ✓ Row 2: 'Portal de cliente caído...' cargado
  ✓ Row 3: 'Candidato no recibe confirmación...' cargado
  ⊘ Row 5: duplicado (título y descripción ya existen)
  ✗ Row 10: categoría desconocida: invalid_cat

----------------------------------------------------------------------
RESUMEN
----------------------------------------------------------------------
Cargadas:  18
Saltadas:  1 (duplicados)
Fallidas:  1
Total:     20

----------------------------------------------------------------------
ERRORES (no se insertaron)
----------------------------------------------------------------------
  Fila 10: categoría desconocida: invalid_cat
======================================================================
```

## Detección de Duplicados

El script verifica si una incidencia ya existe comparando **título y descripción** (case-insensitive). Si ambos coinciden, la fila se salta.

```python
def is_duplicate(title: str, description: str) -> bool:
    """Check if an incident with this title/description exists."""
    existing = get_all_incidents()
    for incident in existing:
        if (incident.get("title", "").lower() == title.lower() and
            incident.get("description", "").lower() == description.lower()):
            return True
    return False
```

## Validaciones Aplicadas

1. **Campos requeridos**: estado, categoría, descripción, fecha, ubicación
2. **Valores enumerados**: estado y categoría deben estar en mapeos predefinidos
3. **Ubicación**: debe ser central, valencia o miami
4. **Texto**: título y descripción se trimean; descripciones vacías se rechazan
5. **Esquema Pydantic**: cada registro se valida contra `IncidentCreate`

## Manejo de Errores

- **Errores de transformación**: se reportan con el nombre del campo problemático
- **Errores de validación**: se listan los campos con problemas
- **Errores inesperados**: se capturan y reportan sin stack trace completo
- **Duplicados**: se reportan como "saltadas", no como fallidas

El script siempre completa la ejecución; los errores no detienen el proceso.

## Idempotencia

Ejecutar el script múltiples veces es seguro:

```bash
# Primera ejecución: carga 20 incidencias
python scripts/seed_incidents.py
# Salida: Cargadas: 20, Saltadas: 0, Fallidas: 0

# Segunda ejecución: no carga nada (todas son duplicados)
python scripts/seed_incidents.py
# Salida: Cargadas: 0, Saltadas: 20, Fallidas: 0

# Tercera ejecución: idem
python scripts/seed_incidents.py
# Salida: Cargadas: 0, Saltadas: 20, Fallidas: 0
```

## Datos Semilla por Defecto

El archivo `data/raw/incidents_historical.csv` contiene 20 incidencias históricas de Nexova con:
- Distribución de estados: 7 resueltas, 7 abiertas, 4 en progreso, 2 descartadas
- Distribución de categorías: soporte_cliente (6), formación_corporativa (3), operaciones_selección (3), etc.
- Distribución de sedes: central (11), valencia (5), miami (4)
- Todas con origen: "customer"

## Integración con el Backend

El script:
1. Importa desde `services/backend/app/` (schemas, database, crud)
2. Cambia el working directory al backend para que TinyDB resuelva paths relativos
3. Inserta directamente en `incidents_table` para permitir estados históricos
4. Valida contra `IncidentCreate` schema

## Rendimiento

Para N registros en el CSV:
- Validación: O(N)
- Detección de duplicados: O(N × M) donde M = incidencias en BD
- Inserción: O(N × log M) en TinyDB

Para 20 registros y ~100 incidencias en BD: < 1 segundo.

---

**Fecha de creación**: 2026-09-09  
**Mantenedor**: Script de automatización
