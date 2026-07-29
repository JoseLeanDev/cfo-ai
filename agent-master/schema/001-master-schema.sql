-- Master Agent Database Schema
-- Database: abaco_master (or agent_master)
-- Purpose: Track all clients, their configs, repos, skills, and context
-- This DB is for the AI agent, NOT for client business data

-- ============================================
-- 1. CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,           -- URL-friendly identifier
    database_url TEXT,                            -- Their own PostgreSQL DB URL
    database_name VARCHAR(100),                   -- Human-readable DB name
    n8n_id VARCHAR(255),                          -- n8n workflow/instance ID
    n8n_webhook_url TEXT,                         -- n8n webhook endpoint
    repository VARCHAR(500),                      -- GitHub/GitLab repo URL
    repository_branch VARCHAR(100) DEFAULT 'main',
    local_path VARCHAR(500),                      -- Local workspace path
    render_service_id VARCHAR(255),               -- Render web service ID
    render_db_id VARCHAR(255),                    -- Render PostgreSQL ID
    status VARCHAR(50) DEFAULT 'onboarding',      -- onboarding, active, paused, archived
    priority INTEGER DEFAULT 1,                   -- 1=high, 2=medium, 3=low
    timezone VARCHAR(100) DEFAULT 'America/Guatemala',
    currency VARCHAR(10) DEFAULT 'GTQ',
    language VARCHAR(10) DEFAULT 'es',
    
    -- Business context (structured JSON for AI retrieval)
    business_context JSONB DEFAULT '{}',          -- Company info, industry, model, mission
    financial_context JSONB DEFAULT '{}',         -- Metrics, thresholds, goals, SAT info
    operational_context JSONB DEFAULT '{}',       -- Tech stack, integrations, tools, workflows
    project_context JSONB DEFAULT '{}',           -- Current phase, sprints, features, milestones
    data_context JSONB DEFAULT '{}',              -- DB schema, key tables, data sources, quality
    ai_context JSONB DEFAULT '{}',                -- Agent personality, autonomy, channels, style
    
    -- Contact info
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    
    -- Onboarding tracking
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    onboarding_steps_completed JSONB DEFAULT '[]', -- ['business_info', 'financial_config', 'tech_stack', 'data_sources', 'ai_preferences']
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_slug ON clients(slug);
CREATE INDEX idx_clients_business ON clients USING GIN (business_context);
CREATE INDEX idx_clients_financial ON clients USING GIN (financial_context);
CREATE INDEX idx_clients_operational ON clients USING GIN (operational_context);

-- ============================================
-- 2. PROJECTS TABLE (a client may have multiple projects/repos)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    repository VARCHAR(500),
    branch VARCHAR(100) DEFAULT 'main',
    local_path VARCHAR(500),
    render_service_id VARCHAR(255),
    project_type VARCHAR(100),                    -- webapp, mobile, api, landing, etc.
    tech_stack JSONB DEFAULT '{}',                -- {frontend: 'React', backend: 'Node', db: 'PostgreSQL'}
    status VARCHAR(50) DEFAULT 'active',
    priority INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, slug)
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================
-- 3. SKILLS TABLE (catalog of available skills)
-- ============================================
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100),                        -- frontend, backend, database, devops, ai, finance, etc.
    keywords TEXT[],                              -- For quick searching
    required_tools TEXT[],                        -- e.g., ['node', 'react', 'postgres']
    documentation_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(category);

-- ============================================
-- 4. CLIENT_SKILLS (what skills each client needs)
-- ============================================
CREATE TABLE IF NOT EXISTS client_skills (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(50) DEFAULT 'intermediate', -- beginner, intermediate, advanced, expert
    notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, skill_id)
);

CREATE INDEX idx_client_skills_client ON client_skills(client_id);

-- ============================================
-- 5b. CLIENT_OBJECTIVES (trackable business/financial objectives)
-- ============================================
CREATE TABLE IF NOT EXISTS client_objectives (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,               -- business, financial, technical, operational
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value NUMERIC,
    target_unit VARCHAR(50),                      -- percentage, amount, days, count
    current_value NUMERIC,
    baseline_value NUMERIC,
    deadline DATE,
    status VARCHAR(50) DEFAULT 'active',          -- active, completed, at_risk, paused
    priority INTEGER DEFAULT 2,                   -- 1=critical, 2=high, 3=medium, 4=low
    progress_percent INTEGER DEFAULT 0,
    related_tables TEXT[],                        -- Which DB tables are relevant
    related_features TEXT[],                      -- Which features/modules
    success_criteria TEXT,                        -- How do we know it's done?
    blockers TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_client_objectives_client ON client_objectives(client_id);
CREATE INDEX idx_client_objectives_status ON client_objectives(status);
CREATE INDEX idx_client_objectives_category ON client_objectives(category);

-- ============================================
-- 5c. CLIENT_DATA_SOURCES (what data feeds this client)
-- ============================================
CREATE TABLE IF NOT EXISTS client_data_sources (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,                   -- "SAT FEL", "Banco Industrial", "n8n Workflows"
    source_type VARCHAR(100) NOT NULL,            -- sat, bank, webhook, api, manual, integration
    status VARCHAR(50) DEFAULT 'pending',         -- pending, active, error, disabled
    config JSONB DEFAULT '{}',                    -- Connection details, credentials ref, endpoints
    sync_frequency VARCHAR(50),                   -- realtime, hourly, daily, weekly, manual
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(50),                 -- success, error, partial
    last_sync_error TEXT,
    records_count INTEGER DEFAULT 0,
    table_mappings JSONB DEFAULT '{}',            -- {source_table: local_table}
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_client_data_sources_client ON client_data_sources(client_id);
CREATE INDEX idx_client_data_sources_status ON client_data_sources(status);
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    log_type VARCHAR(100) NOT NULL,               -- decision, action, error, insight, note, meeting
    category VARCHAR(100),                        -- architecture, feature, bugfix, deployment, business
    title VARCHAR(500),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',                  -- Additional structured data
    importance VARCHAR(20) DEFAULT 'normal',      -- low, normal, high, critical
    created_by VARCHAR(255),                      -- agent name or user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_context_logs_client ON context_logs(client_id);
CREATE INDEX idx_context_logs_type ON context_logs(log_type);
CREATE INDEX idx_context_logs_created ON context_logs(created_at DESC);

-- ============================================
-- 6. AGENT_SESSIONS (track my sessions per client)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_sessions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    session_key VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    summary TEXT,                                 -- What was accomplished
    commits_made TEXT[],                          -- Git commit hashes
    files_modified TEXT[],
    status VARCHAR(50) DEFAULT 'active',          -- active, completed, interrupted
    model_used VARCHAR(100),
    token_usage INTEGER
);

CREATE INDEX idx_agent_sessions_client ON agent_sessions(client_id);
CREATE INDEX idx_agent_sessions_key ON agent_sessions(session_key);

-- ============================================
-- 7. DEPLOYMENTS (track deploys per client)
-- ============================================
CREATE TABLE IF NOT EXISTS deployments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    environment VARCHAR(50) NOT NULL,             -- production, staging, development
    version VARCHAR(100),
    commit_hash VARCHAR(100),
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'success',         -- success, failed, rollback
    logs_url TEXT,
    notes TEXT
);

CREATE INDEX idx_deployments_client ON deployments(client_id);

-- ============================================
-- TRIGGER: Auto-update updated_at on clients and projects
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Default skills catalog
-- ============================================
INSERT INTO skills (name, description, category, keywords, required_tools) VALUES
('React Frontend', 'React.js frontend development with hooks, context, routing', 'frontend', ARRAY['react','javascript','jsx','hooks'], ARRAY['node','npm','vite']),
('Node.js Backend', 'Express/Fastify API development, middleware, auth', 'backend', ARRAY['node','express','api','rest'], ARRAY['node','npm','postgres']),
('PostgreSQL', 'Database design, queries, migrations, optimization', 'database', ARRAY['sql','postgres','relational'], ARRAY['postgres','pg']),
('SQLite', 'Local database for development or small apps', 'database', ARRAY['sqlite','local','development'], ARRAY['sqlite3']),
('DevOps / CI-CD', 'GitHub Actions, Render deploys, Docker, environment setup', 'devops', ARRAY['deploy','ci','cd','github','render'], ARRAY['git','docker']),
('Financial Analysis', 'Cash flow, runway, ratios, financial modeling', 'finance', ARRAY['cfo','runway','liquidity','ratios'], ARRAY['excel','postgres']),
('n8n Workflows', 'Automation workflows, integrations, webhooks', 'automation', ARRAY['n8n','workflow','automation','integration'], ARRAY['n8n']),
('AI Integration', 'LLM APIs, OpenRouter, agent systems, chatbots', 'ai', ARRAY['ai','llm','openrouter','chatbot'], ARRAY['node','openrouter']),
('React Native Mobile', 'Cross-platform mobile app development', 'mobile', ARRAY['react-native','mobile','ios','android'], ARRAY['node','expo']),
('Python Backend', 'FastAPI, Flask, data processing, ML', 'backend', ARRAY['python','fastapi','flask','ml'], ARRAY['python','pip']),
('UI/UX Design', 'Component design, Tailwind, responsive layouts', 'design', ARRAY['tailwind','css','responsive','ui'], ARRAY['figma']),
('SAT / Taxes', 'Guatemala tax compliance, FEL, SAT integrations', 'finance', ARRAY['sat','fel','taxes','guatemala','compliance'], ARRAY['sat-api'])
ON CONFLICT (name) DO NOTHING;
