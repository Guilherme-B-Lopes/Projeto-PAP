-- Projeto PAP - Inicialização MySQL
-- Executa este script para criar a base e as tabelas necessárias.

CREATE DATABASE IF NOT EXISTS pap
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pap;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(190) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    turma VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    images_json LONGTEXT NOT NULL,
    image VARCHAR(500) NULL,
    video_url VARCHAR(500) NULL,
    category ENUM('completo', 'incompleto', 'ideia') NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_date VARCHAR(20) NOT NULL,
    event_time VARCHAR(20) NOT NULL
);

-- Índices opcionais para melhorar consultas frequentes
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_projects_category ON projects (category);
CREATE INDEX idx_events_date_time ON events (event_date, event_time);

-- Dados iniciais de exemplo (opcional)
-- Password do admin exemplo: "admin123" (bcrypt)
INSERT INTO users (username, email, password, role)
SELECT 'admin', 'admin@pap.local', '$2b$10$4n5KfNNN38UQf2VJjyy0c.8Q.v8fGfLvhVhQv6kQQ3YvJ3VtY2W6m', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE role = 'admin'
);
