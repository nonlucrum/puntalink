-- Migración: Agregar tabla grupo_muerto y relación con muro
-- Fecha: 2025-11-09
-- Descripción: Crear tabla para gestionar grupos de muertos con profundidades configurables

\c puntalink;

-- Verificar si la tabla ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grupo_muerto') THEN
        -- Crear tabla grupo_muerto
        CREATE TABLE grupo_muerto (
            pid SERIAL PRIMARY KEY,
            pk_proyecto INT NOT NULL,
            numero_muerto INT NOT NULL,
            nombre VARCHAR(50),
            x_braces INT NOT NULL,
            angulo_brace DECIMAL(10,2) NOT NULL,
            eje VARCHAR(50),
            tipo_construccion VARCHAR(20),
            cantidad_muros INT DEFAULT 0,
            
            -- Parámetros físicos del muerto (EDITABLES POR EL USUARIO)
            profundidad DECIMAL(10,3) DEFAULT 2.0,
            largo DECIMAL(10,3),
            ancho DECIMAL(10,3),
            
            -- Campos calculados para el muerto
            fuerza_total DECIMAL(10,2),
            volumen_concreto DECIMAL(10,3),
            peso_muerto DECIMAL(10,2),
            
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            CONSTRAINT fk_grupo_muerto_proyecto FOREIGN KEY (pk_proyecto) 
                REFERENCES proyecto (pid) ON DELETE CASCADE,
            CONSTRAINT unique_numero_muerto_proyecto UNIQUE (pk_proyecto, numero_muerto)
        );
        
        RAISE NOTICE 'Tabla grupo_muerto creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla grupo_muerto ya existe, omitiendo creación';
    END IF;
END $$;

-- Verificar y agregar columna fk_grupo_muerto a la tabla muro si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'muro' 
        AND column_name = 'fk_grupo_muerto'
    ) THEN
        -- Agregar columna a tabla muro
        ALTER TABLE muro 
        ADD COLUMN fk_grupo_muerto INT;
        
        RAISE NOTICE 'Columna fk_grupo_muerto agregada a tabla muro';
        
        -- Agregar constraint de FK después de crear la columna
        ALTER TABLE muro 
        ADD CONSTRAINT fk_muro_grupo_muerto FOREIGN KEY (fk_grupo_muerto) 
            REFERENCES grupo_muerto (pid) ON DELETE SET NULL;
            
        RAISE NOTICE 'Constraint fk_muro_grupo_muerto agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna fk_grupo_muerto ya existe en tabla muro, omitiendo';
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_grupo_muerto_proyecto ON grupo_muerto(pk_proyecto);
CREATE INDEX IF NOT EXISTS idx_grupo_muerto_numero ON grupo_muerto(numero_muerto);
CREATE INDEX IF NOT EXISTS idx_muro_grupo_muerto ON muro(fk_grupo_muerto);

-- Verificación final
DO $$ 
BEGIN
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Migración completada exitosamente';
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Tabla grupo_muerto: OK';
    RAISE NOTICE 'Columna muro.fk_grupo_muerto: OK';
    RAISE NOTICE 'Constraints y índices: OK';
END $$;
