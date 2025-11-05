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

-- Insert some data into the table
INSERT INTO app_user (name, email, provider)
VALUES ('Victor Silva', 'victor@email.com', 'manual');

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

-- Insertar proyecto de prueba DESPUÉS de crear la tabla
INSERT INTO proyecto (pk_usuario, nombre, empresa, tipo_muerto, vel_viento, temp_promedio, presion_atmo)
VALUES (1, 'Proyecto Prueba', 'Mi Empresa', 'Corrido', 50.0, 22.5, 1013.25);

CREATE TABLE muro (
    pid SERIAL PRIMARY KEY,
    pk_proyecto INT NOT NULL,
    num INT NOT NULL,
    id_muro VARCHAR(45) NOT NULL,
    grosor DECIMAL(10,2),
    area DECIMAL(10,2),
    peso DECIMAL(10,2),
    volumen DECIMAL(10,2),
    overall_height VARCHAR(50),
    
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