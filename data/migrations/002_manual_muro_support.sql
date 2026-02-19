\c puntalink;

-- 1. Agregar columna 'origen' a tabla muro para distinguir muros importados vs manuales
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'muro' AND column_name = 'origen'
    ) THEN
        ALTER TABLE muro ADD COLUMN origen VARCHAR(10) DEFAULT 'TXT' NOT NULL;
        -- Backfill filas existentes como importadas desde TXT
        UPDATE muro SET origen = 'TXT' WHERE origen IS NULL;
    END IF;
END $$;

-- 2. Índice para ordenamiento eficiente por proyecto y número
CREATE INDEX IF NOT EXISTS idx_muro_proyecto_num ON muro(pk_proyecto, num);
