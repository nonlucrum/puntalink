# Migraciones de Base de Datos

Este directorio contiene los scripts de migración para actualizar el esquema de la base de datos.

## 📋 Lista de Migraciones

### 001_add_grupo_muerto.sql
**Fecha**: 2025-11-09  
**Descripción**: Agrega la tabla `grupo_muerto` para gestionar grupos de muertos con profundidades configurables.

**Cambios**:
- ✅ Crea tabla `grupo_muerto` con campos:
  - Información del grupo (número, nombre, x_braces, ángulo, eje)
  - Parámetros físicos editables (profundidad, largo, ancho)
  - Campos calculados (fuerza_total, volumen_concreto, peso_muerto)
- ✅ Agrega columna `fk_grupo_muerto` a tabla `muro`
- ✅ Crea constraints e índices

**Cómo ejecutar**:
```bash
# Desde la terminal de PostgreSQL
psql -U postgres -d puntalink -f 001_add_grupo_muerto.sql

# O desde Docker
docker exec -i puntalink-db psql -U postgres -d puntalink < 001_add_grupo_muerto.sql
```

## 🔄 Proceso de Migración

1. **Backup**: Siempre haz un backup antes de ejecutar migraciones
   ```bash
   pg_dump -U postgres puntalink > backup_$(date +%Y%m%d).sql
   ```

2. **Ejecutar migración**: Ejecuta el script SQL correspondiente

3. **Verificar**: Revisa que los cambios se aplicaron correctamente
   ```sql
   \dt grupo_muerto
   \d grupo_muerto
   \d muro
   ```

## ⚠️ Notas Importantes

- Las migraciones son **idempotentes**: Se pueden ejecutar múltiples veces sin causar errores
- Cada migración verifica si los cambios ya existen antes de aplicarlos
- Los índices mejoran el rendimiento de las consultas
- Las constraints aseguran la integridad de los datos

## 🚀 Siguiente Paso

Después de ejecutar la migración, reinicia el servidor backend para que cargue los nuevos modelos.
