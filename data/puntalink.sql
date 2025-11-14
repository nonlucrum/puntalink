\c puntalink;

-- Create a table
CREATE TABLE app_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  picture VARCHAR(512),
  provider VARCHAR(32),
  google_sub VARCHAR(64),
  last_login TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create another table
CREATE TABLE proyecto (
    pid SERIAL PRIMARY KEY,
    pk_usuario INT NOT NULL,
    nombre VARCHAR(45) NOT NULL,
    empresa VARCHAR(45),
    tipo_muerto VARCHAR(45),
    vel_viento FLOAT,
    temp_promedio FLOAT,
    presion_atmo FLOAT,
    texto_entrada JSON,

    CONSTRAINT fk_proyecto_usuario FOREIGN KEY (pk_usuario) 
        REFERENCES app_user (id) ON DELETE CASCADE
);

CREATE TABLE muro (
    pid SERIAL PRIMARY KEY,
    pk_proyecto INT NOT NULL,
    num INT NOT NULL,
    id_muro VARCHAR(45) NOT NULL,
    grosor DECIMAL(10,2),
    area DECIMAL(10,2),
    peso DECIMAL(10,2),
    volumen DECIMAL(10,2),
    overall_width VARCHAR(50),
    overall_height VARCHAR(50),
    cgx DECIMAL(10,3),
    cgy DECIMAL(10,3),
    
    -- Campos de cálculos de viento
    qz_kpa DECIMAL(10,4),              -- Presión dinámica de viento (kPa)
    presion_kpa DECIMAL(10,4),         -- Presión de viento (kPa)
    fuerza_viento DECIMAL(10,4),       -- Fuerza de viento calculada (kN)
    
    -- Campos manuales editables por muro
    angulo_brace DECIMAL(10,2),        -- Ángulo de inclinación del brace (grados) - Manual
    npt DECIMAL(10,3),                 -- Nivel de Piso Terminado (m) - Manual
    tipo_brace_seleccionado VARCHAR(10) DEFAULT 'B12',  -- Tipo de brace seleccionado manualmente (B04, B12, B14, B15)
    
    -- Campos de braces
    x_braces INT DEFAULT 0,                 -- Cantidad total de braces
    fbx DECIMAL(10,2) DEFAULT 0,            -- Fuerza del brace en dirección X (kN)
    fby DECIMAL(10,2) DEFAULT 0,            -- Fuerza del brace en dirección Y (kN)
    fb DECIMAL(10,2) DEFAULT 0,             -- Fuerza total del brace (kN)
    factor_w2 DECIMAL(10,4) DEFAULT 0.6,    -- Factor W2 para cálculo de tipo de brace
    
    -- Coordenadas de inserto de brace
    x_inserto DECIMAL(10,3),           -- X del inserto = longitud_brace * cos(angulo)
    y_inserto DECIMAL(10,3),           -- Y del inserto = longitud_brace * sin(angulo) + npt
    
    -- Cantidades por tipo de brace
    cant_b14 INT DEFAULT 0,            -- Cantidad de braces tipo B14
    cant_b12 INT DEFAULT 0,            -- Cantidad de braces tipo B12
    cant_b04 INT DEFAULT 0,            -- Cantidad de braces tipo B04
    cant_b15 INT DEFAULT 0,            -- Cantidad de braces tipo B15
    
    -- Campo fijo
    muertos INT DEFAULT 1,             -- Siempre debe ser 1 para conteo de muertos
    
    -- Tipo de construcción
    tipo_construccion VARCHAR(20) DEFAULT 'TILT-UP',  -- TILT-UP o PRECAZT
    
    -- Campo para agrupación por ejes
    eje VARCHAR(50),                   -- Eje asignado para agrupar muros por muertos
    
    -- Relación con grupo de muerto
    fk_grupo_muerto INT,               -- FK a grupo_muerto (NULL si aún no está agrupado)

    CONSTRAINT fk_muro_proyecto FOREIGN KEY (pk_proyecto) 
        REFERENCES proyecto (pid) ON DELETE CASCADE
);

CREATE TABLE brace (
    pid SERIAL PRIMARY KEY,
    fk_muro INT NOT NULL,
    tipo VARCHAR(45),
    angulo FLOAT,
    nivel_braceado FLOAT,
    inserto FLOAT,

    CONSTRAINT fk_brace_muro FOREIGN KEY (fk_muro) 
        REFERENCES muro (pid) ON DELETE CASCADE
);

CREATE TABLE grupo_muerto (
    pid SERIAL PRIMARY KEY,
    pk_proyecto INT NOT NULL,
    numero_muerto INT NOT NULL,           -- Número del muerto (M1, M2, etc.)
    nombre VARCHAR(50),                   -- Nombre descriptivo del grupo
    x_braces INT NOT NULL,                -- Cantidad de braces
    angulo_brace DECIMAL(10,2) NOT NULL,  -- Ángulo de inclinación
    eje VARCHAR(50),                      -- Eje asignado
    tipo_construccion VARCHAR(20),        -- TILT-UP o PRECAZT
    cantidad_muros INT DEFAULT 0,         -- Cantidad de muros en este grupo
    
    -- Parámetros físicos del muerto (EDITABLES POR EL USUARIO)
    profundidad DECIMAL(10,3) DEFAULT 2.0, -- Profundidad del muerto (m) - EDITABLE ⭐
    largo DECIMAL(10,3),                  -- Largo del muerto (m)
    ancho DECIMAL(10,3),                  -- Ancho del muerto (m)
    
    -- Campos calculados para el muerto
    fuerza_total DECIMAL(10,2),           -- Fuerza total del grupo (kN)
    volumen_concreto DECIMAL(10,3),       -- Volumen de concreto necesario (m³)
    peso_muerto DECIMAL(10,2),            -- Peso del muerto (kN)
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_grupo_muerto_proyecto FOREIGN KEY (pk_proyecto) 
        REFERENCES proyecto (pid) ON DELETE CASCADE,
    CONSTRAINT unique_numero_muerto_proyecto UNIQUE (pk_proyecto, numero_muerto)
);

-- Agregar constraint de FK después de crear ambas tablas
ALTER TABLE muro 
ADD CONSTRAINT fk_muro_grupo_muerto FOREIGN KEY (fk_grupo_muerto) 
    REFERENCES grupo_muerto (pid) ON DELETE SET NULL;