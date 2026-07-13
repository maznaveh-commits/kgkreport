CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('superadmin', 'company_manager', 'manager', 'staff');
CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE item_status AS ENUM ('in_progress', 'completed');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE manager_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(manager_id, staff_id)
);

CREATE TABLE assigned_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id UUID REFERENCES users(id),
    staff_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline DATE,
    priority task_priority DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE daily_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES users(id),
    manager_id UUID REFERENCES users(id),
    report_date DATE NOT NULL,
    submitted_date DATE,
    status report_status DEFAULT 'draft',
    delay_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(staff_id, manager_id, report_date)
);

CREATE TABLE report_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
    task_id UUID REFERENCES assigned_tasks(id),
    action_description TEXT NOT NULL,
    duration_minutes INTEGER,
    completion_percent INTEGER CHECK (completion_percent BETWEEN 0 AND 100),
    item_status item_status DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
    type VARCHAR(50),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Default superadmin: username=superadmin, password=Admin@2024
-- CHANGE THIS PASSWORD AFTER FIRST LOGIN
INSERT INTO users (full_name, username, password_hash, role, is_system_admin)
VALUES ('Super Admin', 'superadmin', '$2b$12$evH/1yB87eGPSkHfk.by3Oh.qYHomDD.AVl2FW2mzBwVrENr/tq4y', 'superadmin', true);
