# Seed de Incidencias Históricas — Resumen de Implementación

## Archivos Creados

### 1. CSV Histórico
**Ubicación**: `data/raw/incidents_historical.csv`

- 20 incidencias de cliente en formato CSV
- Campos: id, estado, categoría, descripción, fecha, ubicación
- Datos realistas de Nexova (diferentes departamentos, estados, sedes)
- Listo para ser usado por otros scripts de análisis o reportes

**Distribución de datos:**
| Métrica | Valores |
|---------|---------|
| **Estados** | 7 resueltos, 7 abiertos, 4 en progreso, 2 descartados |
| **Categorías** | 8 categorías representadas |
| **Sedes** | central (11), valencia (5), miami (4) |
| **Origen** | 100% customer |

### 2. Script de Seed
**Ubicación**: `scripts/seed_incidents.py`

**Responsabilidades:**
- Lee CSV histórico
- Transforma campos según mapeos (estado → status, etc.)
- Valida contra esquema Pydantic
- Inserta directamente en TinyDB con estado histórico (no siempre "open")
- Detecta y salta duplicados (idempotencia)
- Reporta errores sin stack traces

**Mapeos implementados:**
```
estado: abierto → open, en_progreso → in_progress, resuelto → resolved, descartado → discarded
categoría: operaciones_selección → recruitment_operations, formación_corporativa → corporate_training, ...
ubicación: central, valencia, miami
descripción: title (primera oración) + description (completa)
```

### 3. Documentación
**Ubicación**: `scripts/seed_incidents.md`

Guía completa con:
- Uso y sintaxis del script
- Mapeos de transformación
- Estructura esperada del CSV
- Manejo de errores
- Validación de idempotencia
- Ejemplos de salida

## Características Implementadas

### ✓ Transformación CSV → Modelo
- Estados: abierto → open, en_progreso → in_progress, resuelto → resolved, descartado → discarded
- Categorías: mapeo exhaustivo a 8 categorías Nexova
- Ubicación (ubicación del CSV) → branch (central, valencia, miami)
- Descripción → title (primera oración, máx 140 chars) + description (completa)
- Fecha → created_at (ISO format)
- Origin: siempre "customer"

### ✓ Reutilización de Lógica Existente
- Valida contra `IncidentCreate` de `app/schemas.py`
- Usa enums `IncidentCategory`, `IncidentStatus`, `IncidentOrigin`, `IncidentBranch`
- Inserta directamente en `incidents_table` de `app/database.py`
- Importa `new_uuid()` y `now_iso()` de `app/schemas.py`

### ✓ Idempotencia
```
Ejecución 1: Cargadas: 20, Saltadas: 0, Fallidas: 0
Ejecución 2: Cargadas: 0, Saltadas: 20, Fallidas: 0
Ejecución 3: Cargadas: 0, Saltadas: 20, Fallidas: 0
```
Comparación: título y descripción (case-insensitive)

### ✓ Manejo de Errores
- Errores de transformación: "estado desconocido: X", "categoría desconocida: Y"
- Errores de validación: "validación fallida en: title, category"
- Duplicados: "duplicado (título y descripción ya existen)"
- Inesperados: "error inesperado: [mensaje]"
- **Sin stack traces**: mensajes en español orientados al usuario

### ✓ Validación Robusta
- Campos requeridos
- Valores enumerados (status, category, origin, branch)
- Rango de caracteres (title: 1-140)
- Texto no vacío (después de trimear)

## Modo de Uso

### Carga inicial (inserta los 20 registros)
```bash
cd /path/to/repo
source .venv/bin/activate
python scripts/seed_incidents.py
```

**Salida:**
```
======================================================================
SEED INCIDENTS FROM CSV
======================================================================
...
----------------------------------------------------------------------
RESUMEN
----------------------------------------------------------------------
Cargadas:  20
Saltadas:  0 (duplicados)
Fallidas:  0
Total:     20
======================================================================
```

### Validación sin insertar
```bash
python scripts/seed_incidents.py --dry-run
```

### CSV personalizado
```bash
python scripts/seed_incidents.py --csv-path /ruta/al/archivo.csv
```

## Integración con el Sistema

Después de ejecutar el seed:

1. **Base de datos**: 20 incidencias cargadas en `services/backend/data/nexova_db.json`
2. **API**: `/incidents?origin=customer` devuelve todos los registros históricos
3. **Frontend**: La página `/incidents` muestra los datos, filtrable por estado/categoría/sede/origen
4. **Filtros funcionales**:
   - Estado: open (7), in_progress (4), resolved (7), discarded (2)
   - Categoría: 8 categorías diferentes
   - Sede: central (11), valencia (5), miami (4)
   - Origen: customer (20/20)

## Verificación

### Contar registros
```bash
jq '.incidents | length' services/backend/data/nexova_db.json
# Output: 20
```

### Distribuir por estado
```python
from app.crud.incidents import get_all_incidents
from collections import Counter
incidents = get_all_incidents()
Counter(i['status'] for i in incidents)
# Counter({'open': 7, 'resolved': 7, 'in_progress': 4, 'discarded': 2})
```

### Probar idempotencia
```bash
python scripts/seed_incidents.py
python scripts/seed_incidents.py  # Debe saltar todos como duplicados
python scripts/seed_incidents.py  # Ídem
```

## Compatibilidad

- Python 3.10+
- TinyDB 4.8.0+
- Pydantic 2.9.2+
- Ejecutable desde cualquier directorio
- Resuelve automáticamente paths relativos

## Próximos Pasos Sugeridos

1. **Ampliar CSV**: agregar más registros históricos si es necesario
2. **Campos adicionales**: si el modelo Incident se extiende, actualizar mapeos
3. **Estrategia de actualización**: si los datos históricos deben actualizarse, crear script de "resync"
4. **Análisis de tendencias**: usar los datos semilla para generar reportes de incidencias por período, sede, categoría

---

**Status**: ✓ **Completado y validado**  
**Fecha**: 2026-09-09  
**Requisitos cumplidos**:
- [x] Script seed_incidents.py en scripts/
- [x] Lee CSV histórico de data/raw/
- [x] Mapeos estado, categoría, ubicación, fecha definidos
- [x] Reutiliza validación del esquema
- [x] Idempotente (no duplica)
- [x] Reporta errores en español
- [x] Documentación completa
