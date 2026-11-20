-- Historial de cambios por activo: quién cambió qué y cuándo.
CREATE TABLE public.activo_eventos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  activo_id text NOT NULL,
  tipo_evento text NOT NULL,
  campo text NOT NULL DEFAULT '',
  valor_anterior text NOT NULL DEFAULT '',
  valor_nuevo text NOT NULL DEFAULT '',
  usuario uuid,
  usuario_email text NOT NULL DEFAULT '',
  creado_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.activo_eventos TO authenticated;
GRANT ALL ON public.activo_eventos TO service_role;

ALTER TABLE public.activo_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users read activo events"
  ON public.activo_eventos
  FOR SELECT
  TO authenticated
  USING (public.is_company_user());

CREATE OR REPLACE FUNCTION public.registrar_activo_evento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  u uuid := auth.uid();
  correo text := coalesce(auth.jwt() ->> 'email', '');
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activo_eventos (activo_id, tipo_evento, campo, valor_anterior, valor_nuevo, usuario, usuario_email)
    VALUES (NEW.id, 'alta', '', '', coalesce(NEW.estado, ''), u, correo);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
      INSERT INTO public.activo_eventos (activo_id, tipo_evento, campo, valor_anterior, valor_nuevo, usuario, usuario_email)
      VALUES (NEW.id, 'cambio', 'estado', coalesce(OLD.estado, ''), coalesce(NEW.estado, ''), u, correo);
    END IF;
    IF NEW.usuario IS DISTINCT FROM OLD.usuario THEN
      INSERT INTO public.activo_eventos (activo_id, tipo_evento, campo, valor_anterior, valor_nuevo, usuario, usuario_email)
      VALUES (NEW.id, 'cambio', 'usuario', coalesce(OLD.usuario, ''), coalesce(NEW.usuario, ''), u, correo);
    END IF;
    IF NEW.area IS DISTINCT FROM OLD.area THEN
      INSERT INTO public.activo_eventos (activo_id, tipo_evento, campo, valor_anterior, valor_nuevo, usuario, usuario_email)
      VALUES (NEW.id, 'cambio', 'area', coalesce(OLD.area, ''), coalesce(NEW.area, ''), u, correo);
    END IF;
    IF NEW.responsable IS DISTINCT FROM OLD.responsable THEN
      INSERT INTO public.activo_eventos (activo_id, tipo_evento, campo, valor_anterior, valor_nuevo, usuario, usuario_email)
      VALUES (NEW.id, 'cambio', 'responsable', coalesce(OLD.responsable, ''), coalesce(NEW.responsable, ''), u, correo);
    END IF;
    IF NEW.ubicacion IS DISTINCT FROM OLD.ubicacion THEN
      INSERT INTO public.activo_eventos (activo_id, tipo_evento, campo, valor_anterior, valor_nuevo, usuario, usuario_email)
      VALUES (NEW.id, 'cambio', 'ubicacion', coalesce(OLD.ubicacion, ''), coalesce(NEW.ubicacion, ''), u, correo);
    END IF;
    IF NEW.empresa IS DISTINCT FROM OLD.empresa THEN
      INSERT INTO public.activo_eventos (activo_id, tipo_evento, campo, valor_anterior, valor_nuevo, usuario, usuario_email)
      VALUES (NEW.id, 'cambio', 'empresa', coalesce(OLD.empresa, ''), coalesce(NEW.empresa, ''), u, correo);
    END IF;
    RETURN NEW;
  END IF;

  INSERT INTO public.activo_eventos (activo_id, tipo_evento, campo, valor_anterior, valor_nuevo, usuario, usuario_email)
  VALUES (OLD.id, 'baja', '', coalesce(OLD.estado, ''), '', u, correo);
  RETURN OLD;
END;
$fn$;

CREATE TRIGGER activos_eventos
  AFTER INSERT OR UPDATE OR DELETE ON public.activos
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_activo_evento();
