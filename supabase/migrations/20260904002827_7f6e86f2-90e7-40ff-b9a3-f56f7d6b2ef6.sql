-- Raccourcis de prompts DodriAI
CREATE TABLE public.dodriai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  prompt text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dodriai_prompts TO authenticated;
GRANT ALL ON public.dodriai_prompts TO service_role;
ALTER TABLE public.dodriai_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY dodriai_prompts_staff_read ON public.dodriai_prompts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY dodriai_prompts_admin_write ON public.dodriai_prompts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER trg_dodriai_prompts_updated BEFORE UPDATE ON public.dodriai_prompts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Suivi des visiteurs
CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  first_path text,
  last_path text,
  referrer text,
  country text,
  city text,
  device text,
  user_agent text,
  page_views integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_visits_created_idx ON public.site_visits (created_at);
CREATE INDEX site_visits_last_seen_idx ON public.site_visits (last_seen_at);
GRANT SELECT, UPDATE, DELETE ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY site_visits_staff_read ON public.site_visits FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY site_visits_admin_delete ON public.site_visits FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Pages / mini-projets générés par DodriAI
CREATE TABLE public.custom_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  content_html text NOT NULL DEFAULT '',
  content_css text NOT NULL DEFAULT '',
  status content_status NOT NULL DEFAULT 'published',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_pages TO authenticated;
GRANT ALL ON public.custom_pages TO service_role;
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY custom_pages_public_read ON public.custom_pages FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY custom_pages_staff_read ON public.custom_pages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY custom_pages_admin_write ON public.custom_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER trg_custom_pages_updated BEFORE UPDATE ON public.custom_pages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();