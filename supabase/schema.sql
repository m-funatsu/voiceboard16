-- ============================================
-- VoiceBoard - Feedback Collection SaaS
-- ============================================

-- Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enum types
CREATE TYPE public.voiceboard_feedback_category AS ENUM ('bug', 'feature', 'improvement');
CREATE TYPE public.voiceboard_feedback_status AS ENUM ('open', 'planned', 'in_progress', 'completed', 'declined');
CREATE TYPE public.voiceboard_plan AS ENUM ('free', 'pro', 'business');

-- ============================================
-- Profiles (admin/project owner accounts)
-- ============================================
CREATE TABLE public.voiceboard_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    plan public.voiceboard_plan NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    premium_activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Projects (feedback boards)
-- ============================================
CREATE TABLE public.voiceboard_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.voiceboard_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    accent_color TEXT NOT NULL DEFAULT '#6366f1',
    logo_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(slug)
);

CREATE INDEX idx_vb_projects_user_id ON public.voiceboard_projects(user_id);
CREATE INDEX idx_vb_projects_slug ON public.voiceboard_projects(slug);

-- ============================================
-- Feedback items
-- ============================================
CREATE TABLE public.voiceboard_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.voiceboard_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category public.voiceboard_feedback_category NOT NULL DEFAULT 'feature',
    status public.voiceboard_feedback_status NOT NULL DEFAULT 'open',
    submitter_email TEXT,
    submitter_fingerprint TEXT,
    vote_count INTEGER NOT NULL DEFAULT 0,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    merged_into_id UUID REFERENCES public.voiceboard_feedback(id) ON DELETE SET NULL,
    embedding vector(1536),
    cluster_id UUID,
    priority_score FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vb_feedback_project ON public.voiceboard_feedback(project_id);
CREATE INDEX idx_vb_feedback_status ON public.voiceboard_feedback(status);
CREATE INDEX idx_vb_feedback_votes ON public.voiceboard_feedback(project_id, vote_count DESC);
CREATE INDEX idx_vb_feedback_created ON public.voiceboard_feedback(project_id, created_at DESC);
CREATE INDEX idx_vb_feedback_approved ON public.voiceboard_feedback(project_id, is_approved, is_archived)
    WHERE is_approved = true AND is_archived = false;

-- ============================================
-- Votes (upvotes on feedback)
-- ============================================
CREATE TABLE public.voiceboard_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES public.voiceboard_feedback(id) ON DELETE CASCADE,
    voter_fingerprint TEXT,
    voter_user_id UUID,
    voter_ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(feedback_id, voter_fingerprint)
);

CREATE INDEX idx_vb_votes_feedback ON public.voiceboard_votes(feedback_id);

-- ============================================
-- AI Clusters (grouped similar feedback)
-- ============================================
CREATE TABLE public.voiceboard_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.voiceboard_projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    summary TEXT,
    combined_vote_count INTEGER NOT NULL DEFAULT 0,
    feedback_count INTEGER NOT NULL DEFAULT 0,
    priority_score FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vb_clusters_project ON public.voiceboard_clusters(project_id);

-- Add foreign key for feedback.cluster_id after clusters table exists
ALTER TABLE public.voiceboard_feedback
    ADD CONSTRAINT fk_vb_feedback_cluster
    FOREIGN KEY (cluster_id) REFERENCES public.voiceboard_clusters(id) ON DELETE SET NULL;

-- ============================================
-- Widget configuration
-- ============================================
CREATE TABLE public.voiceboard_widget_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.voiceboard_projects(id) ON DELETE CASCADE UNIQUE,
    position TEXT NOT NULL DEFAULT 'bottom-right'
        CHECK (position IN ('bottom-right', 'bottom-left', 'top-right', 'top-left')),
    theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    accent_color TEXT NOT NULL DEFAULT '#6366f1',
    trigger_text TEXT NOT NULL DEFAULT 'Feedback',
    show_board_link BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Usage tracking (for plan limits)
-- ============================================
CREATE TABLE public.voiceboard_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.voiceboard_profiles(id) ON DELETE CASCADE,
    billing_period DATE NOT NULL,
    feedback_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, billing_period)
);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE public.voiceboard_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voiceboard_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voiceboard_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voiceboard_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voiceboard_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voiceboard_widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voiceboard_usage ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "vb: Users can view own profile" ON public.voiceboard_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "vb: Users can update own profile" ON public.voiceboard_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Projects
CREATE POLICY "vb: Users can manage own projects" ON public.voiceboard_projects
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "vb: Public can view public projects" ON public.voiceboard_projects
    FOR SELECT USING (is_public = true);

-- Feedback
CREATE POLICY "vb: Project owners can manage feedback" ON public.voiceboard_feedback
    FOR ALL USING (project_id IN (SELECT id FROM public.voiceboard_projects WHERE user_id = auth.uid()));
CREATE POLICY "vb: Anyone can submit feedback to public projects" ON public.voiceboard_feedback
    FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.voiceboard_projects WHERE is_public = true));
CREATE POLICY "vb: Public can view approved feedback" ON public.voiceboard_feedback
    FOR SELECT USING (is_approved = true AND is_archived = false);

-- Votes
CREATE POLICY "vb: Anyone can insert votes" ON public.voiceboard_votes
    FOR INSERT WITH CHECK (true);
CREATE POLICY "vb: Public can view votes" ON public.voiceboard_votes
    FOR SELECT USING (true);

-- Clusters
CREATE POLICY "vb: Project owners can manage clusters" ON public.voiceboard_clusters
    FOR ALL USING (project_id IN (SELECT id FROM public.voiceboard_projects WHERE user_id = auth.uid()));
CREATE POLICY "vb: Public can view clusters" ON public.voiceboard_clusters
    FOR SELECT USING (true);

-- Widget configs
CREATE POLICY "vb: Users can manage own widget configs" ON public.voiceboard_widget_configs
    FOR ALL USING (project_id IN (SELECT id FROM public.voiceboard_projects WHERE user_id = auth.uid()));
CREATE POLICY "vb: Public can read widget configs" ON public.voiceboard_widget_configs
    FOR SELECT USING (true);

-- Usage
CREATE POLICY "vb: Users can view own usage" ON public.voiceboard_usage
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.voiceboard_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vb_profiles_updated BEFORE UPDATE ON public.voiceboard_profiles
    FOR EACH ROW EXECUTE FUNCTION public.voiceboard_update_updated_at();
CREATE TRIGGER vb_projects_updated BEFORE UPDATE ON public.voiceboard_projects
    FOR EACH ROW EXECUTE FUNCTION public.voiceboard_update_updated_at();
CREATE TRIGGER vb_feedback_updated BEFORE UPDATE ON public.voiceboard_feedback
    FOR EACH ROW EXECUTE FUNCTION public.voiceboard_update_updated_at();
CREATE TRIGGER vb_clusters_updated BEFORE UPDATE ON public.voiceboard_clusters
    FOR EACH ROW EXECUTE FUNCTION public.voiceboard_update_updated_at();
CREATE TRIGGER vb_widget_configs_updated BEFORE UPDATE ON public.voiceboard_widget_configs
    FOR EACH ROW EXECUTE FUNCTION public.voiceboard_update_updated_at();

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.voiceboard_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.voiceboard_profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER vb_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.voiceboard_handle_new_user();

-- Upvote function with deduplication
CREATE OR REPLACE FUNCTION public.voiceboard_upvote(
    p_feedback_id UUID,
    p_fingerprint TEXT,
    p_ip_hash TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    inserted BOOLEAN := false;
BEGIN
    BEGIN
        INSERT INTO public.voiceboard_votes (feedback_id, voter_fingerprint, voter_ip_hash)
        VALUES (p_feedback_id, p_fingerprint, p_ip_hash);
        inserted := true;
    EXCEPTION WHEN unique_violation THEN
        inserted := false;
    END;

    IF inserted THEN
        UPDATE public.voiceboard_feedback
        SET vote_count = vote_count + 1
        WHERE id = p_feedback_id;
    END IF;

    RETURN inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment usage counter
CREATE OR REPLACE FUNCTION public.voiceboard_increment_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.voiceboard_usage (user_id, billing_period, feedback_count)
    VALUES (p_user_id, date_trunc('month', CURRENT_DATE)::DATE, 1)
    ON CONFLICT (user_id, billing_period)
    DO UPDATE SET feedback_count = public.voiceboard_usage.feedback_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
