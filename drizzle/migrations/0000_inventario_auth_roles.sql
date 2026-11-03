-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Only verified accounts from the company domain can see data
CREATE OR REPLACE FUNCTION public.is_company_user()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(lower(split_part(auth.jwt() ->> 'email', '@', 2)) = 'grupocabal.cl', false)
$$;

CREATE POLICY "Company users read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_company_user() OR user_id = auth.uid());
CREATE POLICY "Admins grant roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_company_user() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins revoke roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_company_user() AND public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company users read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_company_user() OR id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, coalesce(NEW.raw_user_meta_data ->> 'full_name', ''), coalesce(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- First administrator, granted only once the email is verified
CREATE OR REPLACE FUNCTION public.grant_initial_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND lower(NEW.email) = 'marco.almuna@grupocabal.cl' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_admin
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_initial_admin();
CREATE TRIGGER on_auth_user_confirmed_grant_admin
  AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.grant_initial_admin();

-- Inventory
CREATE TABLE public.activos (
  id text PRIMARY KEY,
  tipo text NOT NULL DEFAULT '',
  marca text NOT NULL DEFAULT '',
  modelo text NOT NULL DEFAULT '',
  serie text NOT NULL DEFAULT '',
  n_inventario text NOT NULL DEFAULT '',
  usuario text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  ubicacion text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT '',
  fecha_entrega text NOT NULL DEFAULT '',
  garantia text NOT NULL DEFAULT '',
  so text NOT NULL DEFAULT '',
  ram text NOT NULL DEFAULT '',
  disco text NOT NULL DEFAULT '',
  ip text NOT NULL DEFAULT '',
  mac text NOT NULL DEFAULT '',
  responsable text NOT NULL DEFAULT '',
  observaciones text NOT NULL DEFAULT '',
  empresa text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activos TO authenticated;
GRANT ALL ON public.activos TO service_role;
ALTER TABLE public.activos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company users read activos" ON public.activos FOR SELECT TO authenticated
  USING (public.is_company_user());
CREATE POLICY "Admins insert activos" ON public.activos FOR INSERT TO authenticated
  WITH CHECK (public.is_company_user() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update activos" ON public.activos FOR UPDATE TO authenticated
  USING (public.is_company_user() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_company_user() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete activos" ON public.activos FOR DELETE TO authenticated
  USING (public.is_company_user() AND public.has_role(auth.uid(), 'admin'));

-- Auto-assign ID ACTIVO / N° de inventario, continuing after the highest number in use
CREATE OR REPLACE FUNCTION public.assign_activo_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    PERFORM pg_advisory_xact_lock(hashtext('activos_id'));
    SELECT coalesce(max(greatest(
      coalesce(nullif(regexp_replace(id, '\D', '', 'g'), '')::int, 0),
      coalesce(nullif(regexp_replace(n_inventario, '\D', '', 'g'), '')::int, 0)
    )), 0) + 1 INTO n FROM public.activos;
    NEW.id := 'ACT-' || lpad(n::text, 4, '0');
    NEW.n_inventario := n::text;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER activos_assign_id BEFORE INSERT ON public.activos
  FOR EACH ROW EXECUTE FUNCTION public.assign_activo_id();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
CREATE TRIGGER activos_touch BEFORE UPDATE ON public.activos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();