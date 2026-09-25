-- ============================================================================
-- rol_agente_ia.sql
-- Crea el usuario de Postgres que usa el agente SQL del chat.
--
-- NO se corre con migrate.js: necesita una contraseña real. Correr a mano una
-- sola vez, reemplazando CAMBIAR_ESTA_PASSWORD, y guardar la cadena de conexión
-- resultante en la variable DATABASE_URL_READONLY del servicio en Render.
--
-- Este rol es el candado que no depende de que el código esté bien escrito:
-- aunque el modelo genere un DROP TABLE y la validación de sqlGuard fallara,
-- Postgres lo rechaza porque el rol no tiene ese permiso.
--
-- Las vistas de analitica corren con los permisos de su dueño, así que el rol
-- lee los datos a través de ellas sin tener acceso a las tablas de public.
-- ============================================================================

DO $crea$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agente_ia') THEN
    CREATE ROLE agente_ia LOGIN PASSWORD 'CAMBIAR_ESTA_PASSWORD';
  END IF;
END
$crea$;

GRANT CONNECT ON DATABASE cfo_ai_db TO agente_ia;

-- Ver el schema analitica y leer sus vistas: sí.
GRANT USAGE  ON SCHEMA analitica TO agente_ia;
GRANT SELECT ON ALL TABLES IN SCHEMA analitica TO agente_ia;
ALTER DEFAULT PRIVILEGES IN SCHEMA analitica GRANT SELECT ON TABLES TO agente_ia;

-- Tocar las tablas crudas o crear objetos: no.
REVOKE ALL    ON SCHEMA public FROM agente_ia;
REVOKE ALL    ON ALL TABLES IN SCHEMA public FROM agente_ia;
REVOKE CREATE ON SCHEMA analitica FROM agente_ia;

-- Solo ve analitica: un DROP TABLE transacciones ni siquiera resuelve el nombre.
ALTER ROLE agente_ia SET search_path = analitica;

-- Topes de sesión, independientes del código de la app.
ALTER ROLE agente_ia SET statement_timeout = '5s';
ALTER ROLE agente_ia SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE agente_ia SET default_transaction_read_only = on;
