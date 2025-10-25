# 🚀 QUICK START - Sistema de Braces

## Pasos para Activar el Sistema

### 1️⃣ Levantar Docker (si no está corriendo)
```powershell
cd C:\Users\sebas\OneDrive\Documentos\GitHub\puntalink
docker-compose up -d
```

### 2️⃣ Ejecutar Migración de Base de Datos
```powershell
docker-compose exec db psql -U postgres -f /docker-entrypoint-initdb.d/migration_add_brace_fields.sql
```

### 3️⃣ Verificar que las Columnas se Agregaron
```powershell
docker-compose exec db psql -U postgres -d puntalink -c "\d muro"
```

Deberías ver estas columnas nuevas:
- angulo_brace
- npt
- x_braces
- fbx, fby, fb
- cant_b14, cant_b12, cant_b04, cant_b15
- muertos
- tipo_construccion

### 4️⃣ Abrir en Navegador
```
http://localhost/dashboard
```

---

## 🎯 Flujo de Uso

### Paso 1: Importar Muros
1. Ve a sección **"Importar Datos desde TXT"**
2. Selecciona tu archivo `.txt`
3. Haz clic en **"Subir y procesar TXT"**
4. ✅ Los muros se importan automáticamente

### Paso 2: Configurar Braces
1. Ve a sección **"Configuración de Braces"** (se despliega automáticamente)
2. Ingresa valores globales:
   - **Ángulo:** 45° (o el que necesites)
   - **NPT:** 0.350m (o el que necesites)
3. Haz clic en **"Aplicar a Todos los Muros"**
4. ✅ Todos los muros tienen los mismos valores

### Paso 3: Editar Individual (Opcional)
1. En la tabla, edita valores específicos por muro:
   - Ángulo
   - NPT
   - X (cantidad de braces)
   - Tipo de construcción
2. Haz clic en **"Guardar"** por cada muro editado
3. ✅ Valores individuales guardados

### Paso 4: Calcular Viento y Braces
1. Ve a sección **"Cálculo de Cargas de Viento"**
2. Configura parámetros de viento
3. Haz clic en **"Calcular Cargas de Viento por Muros"**
4. ✅ Sistema calcula:
   - Fuerzas de viento
   - FB, FBx, FBy (fuerzas de braces)
   - Distribución por tipo (B14/B12/B04/B15)

### Paso 5: Ver Resultados
1. Regresa a sección **"Configuración de Braces"**
2. Verás la tabla actualizada con:
   - FBx, FBy, FB calculados
   - Cantidades por tipo de brace
   - Todos los datos guardados en BD

---

## 🆘 Solución de Problemas

### Error: "Docker no está corriendo"
```powershell
# Verificar estado de Docker
docker ps

# Si no hay respuesta, iniciar Docker Desktop
# Luego ejecutar:
docker-compose up -d
```

### Error: "No hay muros importados"
1. Ve a sección "Importar Datos desde TXT"
2. Sube un archivo .txt válido
3. Espera a que aparezca la confirmación

### Error: "Cannot read property 'angulo_brace'"
- La migración no se ejecutó
- Ejecuta el comando de migración del Paso 2️⃣

### Tabla de braces no se carga
1. Abre consola del navegador (F12)
2. Busca errores en rojo
3. Verifica que el backend esté corriendo:
   ```powershell
   docker-compose ps
   ```

---

## 📊 Ejemplo Completo

### Datos de Entrada
```
Proyecto: Mi Edificio
Muros: M01, M02, M03 (importados desde TXT)

Valores Globales:
- Ángulo: 55°
- NPT: 0.350m

Configuración Individual M01:
- X Braces: 2
- Tipo: TILT-UP
```

### Resultados Esperados (después de calcular viento)
```
Muro M01:
- Fuerza Viento: 1366.37 kN
- FB: 683.19 kN (por brace)
- FBx: 781.83 kN
- FBy: 1121.09 kN
- Tipo Brace: B15 (alta capacidad)
- Cantidad B15: 2
```

---

## ✅ Checklist de Verificación

- [ ] Docker está corriendo
- [ ] Migración ejecutada sin errores
- [ ] Columnas nuevas en tabla `muro`
- [ ] Dashboard carga correctamente
- [ ] Muros importados desde TXT
- [ ] Sección "Configuración de Braces" visible
- [ ] Valores globales se aplican
- [ ] Tabla muestra datos de muros
- [ ] Inputs son editables
- [ ] Botón "Guardar" funciona
- [ ] Cálculo de viento actualiza braces
- [ ] Valores FBx, FBy, FB aparecen
- [ ] Distribución por tipo correcta

---

## 🎉 ¡Listo!

Si todos los pasos anteriores funcionan, el sistema de braces está **100% operativo**.

Para más detalles técnicos, revisa:
- `RESUMEN_IMPLEMENTACION_BRACES.md` (documentación completa)
- `IMPLEMENTACION_BRACES.md` (detalles técnicos)
