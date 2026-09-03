-- =========================================================
-- VOTOSMART - ESQUEMA DE BASE DE DATOS POSTGRESQL
-- Plataforma Inteligente para Gestión de Asambleas y Votaciones
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CONJUNTOS RESIDENCIALES
CREATE TABLE IF NOT EXISTS residential_complexes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    nit VARCHAR(50) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(150),
    logo VARCHAR(500),
    total_units INT DEFAULT 0,
    total_coefficient NUMERIC(6,3) DEFAULT 100.000,
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    auto_send_results BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USUARIOS Y AUTENTICACIÓN
CREATE TYPE user_role_type AS ENUM ('superadmin', 'admin', 'president', 'accountant', 'owner');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complex_id UUID REFERENCES residential_complexes(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_type NOT NULL DEFAULT 'owner',
    phone VARCHAR(50),
    document_type VARCHAR(20) DEFAULT 'CC',
    document_number VARCHAR(50),
    apartment VARCHAR(50),
    building VARCHAR(50),
    coefficient NUMERIC(6,4) DEFAULT 0.0000,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_complex ON users(complex_id);
CREATE INDEX idx_users_email ON users(email);

-- 3. PROPIETARIOS E INMUEBLES
CREATE TABLE IF NOT EXISTS owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complex_id UUID REFERENCES residential_complexes(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    document_type VARCHAR(20) DEFAULT 'CC',
    document_number VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    building VARCHAR(50) NOT NULL,
    apartment VARCHAR(50) NOT NULL,
    coefficient NUMERIC(6,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    has_proxy BOOLEAN DEFAULT FALSE,
    proxy_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_unit_in_complex UNIQUE(complex_id, building, apartment)
);

CREATE INDEX idx_owners_complex ON owners(complex_id);
CREATE INDEX idx_owners_document ON owners(document_number);

-- 4. ASAMBLEAS
CREATE TYPE assembly_type_enum AS ENUM ('ordinaria', 'extraordinaria');
CREATE TYPE assembly_modality_enum AS ENUM ('presencial', 'virtual', 'mixta');
CREATE TYPE assembly_status_enum AS ENUM ('draft', 'scheduled', 'in_progress', 'finished', 'cancelled');

CREATE TABLE IF NOT EXISTS assemblies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complex_id UUID REFERENCES residential_complexes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    type assembly_type_enum NOT NULL DEFAULT 'ordinaria',
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(200) NOT NULL,
    modality assembly_modality_enum NOT NULL DEFAULT 'mixta',
    description TEXT,
    status assembly_status_enum NOT NULL DEFAULT 'draft',
    administrator_name VARCHAR(150),
    president_name VARCHAR(150),
    accountant_name VARCHAR(150),
    secretary_name VARCHAR(150),
    required_quorum NUMERIC(5,2) DEFAULT 50.01,
    total_owners_invited INT DEFAULT 0,
    represented_quorum NUMERIC(6,4) DEFAULT 0.0000,
    checked_in_owners_count INT DEFAULT 0,
    auto_send_minutes BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_assemblies_complex ON assemblies(complex_id);
CREATE INDEX idx_assemblies_status ON assemblies(status);

-- 5. ASISTENCIA Y QUÓRUM
CREATE TABLE IF NOT EXISTS quorum_attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(150),
    notes TEXT,
    CONSTRAINT unique_owner_in_assembly UNIQUE(assembly_id, owner_id)
);

-- 6. DOCUMENTOS DE ASAMBLEA
CREATE TABLE IF NOT EXISTS assembly_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_size VARCHAR(50),
    uploaded_by VARCHAR(150),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. NOTAS DE LA ASAMBLEA (BITÁCORA)
CREATE TABLE IF NOT EXISTS assembly_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    author_role VARCHAR(50) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. VOTACIONES
CREATE TYPE vote_type_enum AS ENUM ('yes_no', 'single_choice', 'multiple_choice', 'candidate_election', 'multi_position_election');
CREATE TYPE vote_status_enum AS ENUM ('draft', 'scheduled', 'active', 'finished', 'cancelled');

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    question TEXT NOT NULL,
    type vote_type_enum NOT NULL DEFAULT 'single_choice',
    min_selections INT DEFAULT 1,
    max_selections INT DEFAULT 1,
    status vote_status_enum NOT NULL DEFAULT 'draft',
    requires_coefficient BOOLEAN DEFAULT TRUE,
    is_secret BOOLEAN DEFAULT FALSE,
    show_live_results BOOLEAN DEFAULT TRUE,
    allow_abstain BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_votes_assembly ON votes(assembly_id);
CREATE INDEX idx_votes_status ON votes(status);

-- 9. OPCIONES Y CANDIDATOS
CREATE TABLE IF NOT EXISTS vote_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vote_id UUID REFERENCES votes(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vote_id UUID REFERENCES votes(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    apartment VARCHAR(50),
    building VARCHAR(50),
    profile_summary TEXT,
    proposals TEXT,
    experience TEXT,
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. REGISTRO DE VOTOS Y PREVENCIÓN DE DUPLICADOS
-- Trazabilidad de participación (Evita duplicados sin violar privacidad si es secreto)
CREATE TABLE IF NOT EXISTS voter_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vote_id UUID REFERENCES votes(id) ON DELETE CASCADE,
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    voter_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    voter_name VARCHAR(150) NOT NULL,
    voter_apartment VARCHAR(50) NOT NULL,
    voter_document VARCHAR(50) NOT NULL,
    voter_coefficient NUMERIC(6,4) NOT NULL,
    receipt_code VARCHAR(64) NOT NULL UNIQUE,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_voter_per_vote UNIQUE(vote_id, voter_user_id)
);

CREATE INDEX idx_participation_vote ON voter_participations(vote_id);

-- Almacén de votos computables (separado del ID de usuario si is_secret = true)
CREATE TABLE IF NOT EXISTS vote_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vote_id UUID REFERENCES votes(id) ON DELETE CASCADE,
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    voter_apartment VARCHAR(50),
    voter_coefficient NUMERIC(6,4) NOT NULL,
    selected_option_ids JSONB NOT NULL,
    verification_code VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vote_records_vote ON vote_records(vote_id);

-- 11. ACTAS DE ASAMBLEA
CREATE TABLE IF NOT EXISTS assembly_minutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    intro_text TEXT,
    summary TEXT,
    voting_summary TEXT,
    observations TEXT,
    conclusions TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    signatures JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(150)
);

-- 12. REGISTRO DE AUDITORÍA (AUDIT LOG)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_id UUID,
    user_id VARCHAR(100),
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_assembly ON audit_logs(assembly_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- 13. REGISTRO DE CORREOS (EMAIL LOGS)
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    recipient_email VARCHAR(150) NOT NULL,
    recipient_name VARCHAR(150),
    subject VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
