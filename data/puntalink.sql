\c puntalink;

-- Create a table
CREATE TABLE usuario (
    pid SERIAL PRIMARY KEY,
    nombre VARCHAR(240) NOT NULL,
    correo VARCHAR(240) UNIQUE NOT NULL,
    password VARCHAR(45) NOT NULL
);

-- Insert some data into the table
INSERT INTO usuario (nombre, correo, password)
VALUES ('Victor Silva', 'victor@email.com', '12345');

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
        REFERENCES usuario (pid) ON DELETE CASCADE
);

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
    
    -- Campos manuales editables por muro
    angulo_brace DECIMAL(10,2),        -- Ángulo de inclinación del brace (grados) - Manual
    npt DECIMAL(10,3),                 -- Nivel de Piso Terminado (m) - Manual
    tipo_brace_seleccionado VARCHAR(10) DEFAULT 'B12',  -- Tipo de brace seleccionado manualmente (B04, B12, B14, B15)
    
    -- Campos de braces
    x_braces INT DEFAULT 0,            -- Cantidad total de braces
    fbx DECIMAL(10,2) DEFAULT 0,       -- Fuerza del brace en dirección X (kN)
    fby DECIMAL(10,2) DEFAULT 0,       -- Fuerza del brace en dirección Y (kN)
    fb DECIMAL(10,2) DEFAULT 0,        -- Fuerza total del brace (kN)
    
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