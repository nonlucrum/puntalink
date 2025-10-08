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
VALUES (1, 'Proyecto Prueba', 'Mi Empresa', 'corrido', 50.0, 22.5, 1013.25);

CREATE TABLE muro (
    pid SERIAL PRIMARY KEY,
    pk_proyecto INT NOT NULL,
    id_muro VARCHAR(45) NOT NULL,
    grosor INT,
    area FLOAT,
    peso FLOAT,
    volumen FLOAT,
    overall_height FLOAT,

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