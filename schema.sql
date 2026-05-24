-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  ign TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player_new',
  guild TEXT,
  discord_tag TEXT NOT NULL,
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
('mtlh', 52, '58M', 12, 'Brute force et discipline du fer. Metalheads frappe fort, frappe ensemble, et ne lâche jamais une cible avant qu''elle soit morte.', 'Brute force and iron discipline. Metalheads hits hard, hits together, and never drops a target until it''s dead.');

-- ============================================================
-- RLS (Row Level Security) Configuration
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is officer
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
-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- APPLICATIONS
-- Officers can view all applications, users can view their own
CREATE POLICY "Officers can view all applications" ON public.applications FOR SELECT USING (is_officer(auth.uid()));
CREATE POLICY "Users can view own application" ON public.applications FOR SELECT USING (auth.uid() = user_id);
-- Authenticated users can create an application
CREATE POLICY "Users can create application" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update their own application if pending, officers can update any
CREATE POLICY "Users can update own pending app" ON public.applications FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Officers can update any app" ON public.applications FOR UPDATE USING (is_officer(auth.uid()));

-- MESSAGES
-- Officers can view all, users can view messages on their own app
CREATE POLICY "Officers can view all messages" ON public.messages FOR SELECT USING (is_officer(auth.uid()));
CREATE POLICY "Users can view messages on their app" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.applications WHERE id = messages.application_id AND user_id = auth.uid())
);
-- Officers can insert on any, users can insert on their own app
CREATE POLICY "Officers can insert messages" ON public.messages FOR INSERT WITH CHECK (is_officer(auth.uid()));
CREATE POLICY "Users can insert messages on their app" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND user_id = auth.uid())
);

-- VOTES
-- Officers can view all votes
CREATE POLICY "Officers can view votes" ON public.votes FOR SELECT USING (is_officer(auth.uid()));
-- Only officers can insert/update their own votes
CREATE POLICY "Officers can vote" ON public.votes FOR INSERT WITH CHECK (is_officer(auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Officers can change vote" ON public.votes FOR UPDATE USING (is_officer(auth.uid()) AND auth.uid() = user_id);

-- GUILD SETTINGS
-- Anyone can view
CREATE POLICY "Settings are viewable by everyone" ON public.guild_settings FOR SELECT USING (true);
-- Only super/R5 can update
CREATE POLICY "Super and R5 can update settings" ON public.guild_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super', 'rad_r5', 'mtlh_r5'))
);
