-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  ign TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player_new',
  guild TEXT,
  discord_tag TEXT NOT NULL,
  is_prince BOOLEAN DEFAULT FALSE,
  is_recruiter BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. applications table
CREATE TABLE public.applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  uid TEXT NOT NULL,
  server TEXT NOT NULL,
  power BIGINT NOT NULL,
  timezone TEXT NOT NULL,
  language TEXT NOT NULL,
  motivation TEXT,
  guild TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'chat',
  text TEXT,
  question TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. votes table
CREATE TABLE public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  choice TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- 5. guild_settings table
CREATE TABLE public.guild_settings (
  id TEXT PRIMARY KEY,
  members INT NOT NULL DEFAULT 0,
  avg_power TEXT,
  slots INT NOT NULL DEFAULT 0,
  req JSONB NOT NULL DEFAULT '[]'::jsonb,
  req_en JSONB NOT NULL DEFAULT '[]'::jsonb,
  pitch TEXT,
  pitch_en TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.guild_settings (id, members, avg_power, slots, pitch, pitch_en)
VALUES 
('rad', 47, '73M', 8, 'Coordination chirurgicale, jeu organisé, KvK haut niveau. La Radiant aligne ses heures, ses cibles, et ses pertes.', 'Surgical coordination, structured play, top-tier SvS & GvG. The Radiant aligns its hours, its targets, and its losses.'),
('mtlh', 52, '58M', 12, 'Brute force et discipline du fer. Metalheads frappe fort, frappe ensemble, et ne lâche jamais une cible avant qu''elle soit morte.', 'Brute force and iron discipline. Metalheads hits hard, hits together, and never drops a target until it''s dead.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS (Row Level Security) Configuration
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is officer (any R4/R5 or super)
CREATE OR REPLACE FUNCTION is_officer(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = check_user_id 
    AND role IN ('rad_r4', 'rad_r5', 'mtlh_r4', 'mtlh_r5', 'super')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES
-- Anyone can read profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Super admins can update any profile (to assign roles/prince/recruiter/admin)
CREATE POLICY "Super admin can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super' OR is_admin = true))
);

-- ============================================================
-- PROFILES SECURITY TRIGGER (Protects role & admin flags)
-- ============================================================
CREATE OR REPLACE FUNCTION protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user making the change is a super admin, allow anything
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super' OR is_admin = true)) THEN
    RETURN NEW;
  END IF;

  -- Otherwise, ignore changes to sensitive columns
  NEW.role = OLD.role;
  NEW.is_admin = OLD.is_admin;
  NEW.is_prince = OLD.is_prince;
  NEW.is_recruiter = OLD.is_recruiter;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_security ON public.profiles;
CREATE TRIGGER enforce_profile_security
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION protect_profile_roles();

-- APPLICATIONS
-- RLS for SELECT
CREATE POLICY "Officers can view relevant applications" ON public.applications FOR SELECT USING (
  -- Super admin sees all
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super')) OR
  -- R4/R5 see their guild
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('rad_r4', 'rad_r5') AND public.applications.guild = 'rad')) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('mtlh_r4', 'mtlh_r5') AND public.applications.guild = 'mtlh')) OR
  -- Prince and Recruiter see all accepted apps
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_prince = true OR is_recruiter = true) AND public.applications.status = 'accepted')) OR
  -- Users see their own
  (auth.uid() = user_id)
);
-- Authenticated users can create an application (Enforcing status='pending')
CREATE POLICY "Users can create application" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
-- Users can update their own application if pending
CREATE POLICY "Users can update own pending app" ON public.applications FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
-- Officers can update applications in their guild, super admin can update any
CREATE POLICY "Officers can update relevant apps" ON public.applications FOR UPDATE USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super')) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('rad_r4', 'rad_r5') AND public.applications.guild = 'rad')) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('mtlh_r4', 'mtlh_r5') AND public.applications.guild = 'mtlh'))
);

-- MESSAGES
-- Officers can view all messages for apps they can see
CREATE POLICY "Officers can view messages" ON public.messages FOR SELECT USING (is_officer(auth.uid()));
CREATE POLICY "Users can view messages on their app" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = messages.application_id AND user_id = auth.uid())
);
-- Officers can insert messages (Spoofing prevention)
CREATE POLICY "Officers can insert messages" ON public.messages FOR INSERT WITH CHECK (is_officer(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "Users can insert messages on their app" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND user_id = auth.uid()) AND author_id = auth.uid()
);

-- VOTES
CREATE POLICY "Officers can view votes" ON public.votes FOR SELECT USING (is_officer(auth.uid()));
CREATE POLICY "Officers can vote" ON public.votes FOR INSERT WITH CHECK (is_officer(auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Officers can change vote" ON public.votes FOR UPDATE USING (is_officer(auth.uid()) AND auth.uid() = user_id);

-- GUILD SETTINGS
CREATE POLICY "Settings are viewable by everyone" ON public.guild_settings FOR SELECT USING (true);
CREATE POLICY "Super and R5 can update settings" ON public.guild_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super' OR is_admin = true)) OR
  (id = 'rad' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'rad_r5')) OR
  (id = 'mtlh' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mtlh_r5'))
);
