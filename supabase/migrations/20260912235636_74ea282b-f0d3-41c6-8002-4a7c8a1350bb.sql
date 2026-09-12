-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('nutritionist', 'patient');
CREATE TYPE public.meal_type AS ENUM ('desayuno', 'almuerzo', 'merienda', 'cena', 'colacion');
CREATE TYPE public.feedback_level AS ENUM ('excelente', 'bien', 'a_mejorar');
CREATE TYPE public.consultation_type AS ENUM ('inicial', 'seguimiento');
CREATE TYPE public.consultation_status AS ENUM ('solicitada', 'confirmada', 'realizada', 'cancelada');
CREATE TYPE public.payment_status AS ENUM ('pendiente', 'pagado');

-- ===== Utilities =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- ===== Profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  invite_code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Roles =====
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ===== Patient <-> Nutritionist links =====
CREATE TABLE public.patient_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE,
  nutritionist_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.patient_links TO authenticated;
GRANT ALL ON public.patient_links TO service_role;
ALTER TABLE public.patient_links ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_my_patient(_patient_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patient_links
    WHERE patient_id = _patient_id AND nutritionist_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.my_nutritionist_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nutritionist_id FROM public.patient_links WHERE patient_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "Participants can view links" ON public.patient_links
  FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR nutritionist_id = auth.uid());
CREATE POLICY "Participants can remove links" ON public.patient_links
  FOR DELETE TO authenticated
  USING (patient_id = auth.uid() OR nutritionist_id = auth.uid());

-- Profiles policies (need helper functions above)
CREATE POLICY "Users can view related profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_my_patient(id) OR id = public.my_nutritionist_id());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ===== Meal logs =====
CREATE TABLE public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  log_time time NOT NULL DEFAULT (now()::time),
  meal_type public.meal_type NOT NULL,
  foods text NOT NULL,
  portions text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  feeling text NOT NULL DEFAULT '',
  feedback public.feedback_level,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meal_logs_patient_date_idx ON public.meal_logs (patient_id, log_date DESC, log_time);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_logs TO authenticated;
GRANT ALL ON public.meal_logs TO service_role;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs REPLICA IDENTITY FULL;
CREATE TRIGGER meal_logs_updated_at BEFORE UPDATE ON public.meal_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Patients manage own meal logs" ON public.meal_logs
  FOR ALL TO authenticated
  USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Nutritionists view their patients' logs" ON public.meal_logs
  FOR SELECT TO authenticated
  USING (public.is_my_patient(patient_id));
CREATE POLICY "Nutritionists rate their patients' logs" ON public.meal_logs
  FOR UPDATE TO authenticated
  USING (public.is_my_patient(patient_id)) WITH CHECK (public.is_my_patient(patient_id));

-- ===== Meal comments =====
CREATE TABLE public.meal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id uuid NOT NULL REFERENCES public.meal_logs(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meal_comments_patient_idx ON public.meal_comments (patient_id, created_at DESC);
CREATE INDEX meal_comments_log_idx ON public.meal_comments (meal_log_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_comments TO authenticated;
GRANT ALL ON public.meal_comments TO service_role;
ALTER TABLE public.meal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_comments REPLICA IDENTITY FULL;

CREATE POLICY "Participants view comments" ON public.meal_comments
  FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR public.is_my_patient(patient_id));
CREATE POLICY "Nutritionists comment on their patients' logs" ON public.meal_comments
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.is_my_patient(patient_id));
CREATE POLICY "Authors edit own comments" ON public.meal_comments
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete own comments" ON public.meal_comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- ===== Consultations =====
CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  nutritionist_id uuid NOT NULL,
  type public.consultation_type NOT NULL DEFAULT 'seguimiento',
  status public.consultation_status NOT NULL DEFAULT 'solicitada',
  preferred_date date,
  preferred_time_note text NOT NULL DEFAULT '',
  scheduled_at timestamptz,
  payment_status public.payment_status NOT NULL DEFAULT 'pendiente',
  patient_notes text NOT NULL DEFAULT '',
  nutritionist_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consultations_patient_idx ON public.consultations (patient_id, created_at DESC);
CREATE INDEX consultations_nutritionist_idx ON public.consultations (nutritionist_id, scheduled_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT ALL ON public.consultations TO service_role;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations REPLICA IDENTITY FULL;
CREATE TRIGGER consultations_updated_at BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Patients view own consultations" ON public.consultations
  FOR SELECT TO authenticated USING (patient_id = auth.uid());
CREATE POLICY "Patients request consultations with their nutritionist" ON public.consultations
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid() AND nutritionist_id = public.my_nutritionist_id());
CREATE POLICY "Patients update own consultations" ON public.consultations
  FOR UPDATE TO authenticated
  USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Nutritionists view their consultations" ON public.consultations
  FOR SELECT TO authenticated USING (nutritionist_id = auth.uid());
CREATE POLICY "Nutritionists schedule for their patients" ON public.consultations
  FOR INSERT TO authenticated
  WITH CHECK (nutritionist_id = auth.uid() AND public.is_my_patient(patient_id));
CREATE POLICY "Nutritionists manage their consultations" ON public.consultations
  FOR UPDATE TO authenticated
  USING (nutritionist_id = auth.uid()) WITH CHECK (nutritionist_id = auth.uid());
CREATE POLICY "Nutritionists delete their consultations" ON public.consultations
  FOR DELETE TO authenticated USING (nutritionist_id = auth.uid());

-- ===== Articles =====
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  summary text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX articles_published_idx ON public.articles (published, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Published articles are visible to signed-in users" ON public.articles
  FOR SELECT TO authenticated USING (published = true OR author_id = auth.uid());
CREATE POLICY "Nutritionists create articles" ON public.articles
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.has_role(auth.uid(), 'nutritionist'));
CREATE POLICY "Authors update own articles" ON public.articles
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete own articles" ON public.articles
  FOR DELETE TO authenticated USING (author_id = auth.uid());

-- ===== RPCs =====
-- Grants a role to the calling user (used at onboarding and by the demo role switcher).
CREATE OR REPLACE FUNCTION public.grant_self_role(_role public.app_role)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  code text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, _role) ON CONFLICT DO NOTHING;
  IF _role = 'nutritionist' THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND invite_code IS NOT NULL) THEN
      LOOP
        code := public.generate_invite_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = code);
      END LOOP;
      UPDATE public.profiles SET invite_code = code WHERE id = uid;
    END IF;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_self_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_self_role(public.app_role) TO authenticated;

-- Links the calling patient to a nutritionist via invite code. Returns nutritionist name.
CREATE OR REPLACE FUNCTION public.link_to_nutritionist(_code text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  nut public.profiles%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO nut FROM public.profiles WHERE invite_code = upper(trim(_code));
  IF nut.id IS NULL OR NOT public.has_role(nut.id, 'nutritionist') THEN
    RAISE EXCEPTION 'Código inválido';
  END IF;
  IF nut.id = uid THEN RAISE EXCEPTION 'No podés vincularte con vos mismo'; END IF;
  INSERT INTO public.patient_links (patient_id, nutritionist_id) VALUES (uid, nut.id)
    ON CONFLICT (patient_id) DO UPDATE SET nutritionist_id = EXCLUDED.nutritionist_id;
  RETURN nut.full_name;
END;
$$;
REVOKE ALL ON FUNCTION public.link_to_nutritionist(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_to_nutritionist(text) TO authenticated;

-- ===== New user trigger =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chosen text := NEW.raw_user_meta_data ->> 'role';
  code text;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  IF chosen IN ('patient', 'nutritionist') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, chosen::public.app_role);
    IF chosen = 'nutritionist' THEN
      LOOP
        code := public.generate_invite_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = code);
      END LOOP;
      UPDATE public.profiles SET invite_code = code WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== Realtime =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;