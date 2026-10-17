-- Daymark work from home attendance schema
-- Compatible with MySQL 8.0+

CREATE DATABASE IF NOT EXISTS attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE attendance;

CREATE TABLE IF NOT EXISTS roles (
  role_id VARCHAR(36) NOT NULL,
  role_name VARCHAR(80) NOT NULL,
  PRIMARY KEY (role_id),
  UNIQUE KEY uq_roles_role_name (role_name)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS employees (
  employee_id VARCHAR(36) NOT NULL,
  name VARCHAR(140) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL COMMENT 'bcrypt password hash; never store a plain-text password',
  birth_date DATE NOT NULL,
  address TEXT NOT NULL,
  address_longitude DECIMAL(10, 7) NOT NULL,
  address_latitude DECIMAL(10, 7) NOT NULL,
  role_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (employee_id),
  UNIQUE KEY uq_employees_email (email),
  KEY idx_employees_role_id (role_id),
  CONSTRAINT chk_employees_longitude
    CHECK (address_longitude >= -180 AND address_longitude <= 180),
  CONSTRAINT chk_employees_latitude
    CHECK (address_latitude >= -90 AND address_latitude <= 90),
  CONSTRAINT fk_employees_role
    FOREIGN KEY (role_id) REFERENCES roles (role_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS employee_roles (
  employee_id VARCHAR(36) NOT NULL,
  role_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (employee_id, role_id),
  UNIQUE KEY uq_employee_roles_employee (employee_id),
  KEY idx_employee_roles_role_id (role_id),
  CONSTRAINT fk_employee_roles_employee
    FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_employee_roles_role
    FOREIGN KEY (role_id) REFERENCES roles (role_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS attendances (
  attendance_id VARCHAR(36) NOT NULL,
  evidence_photo_address VARCHAR(500) NOT NULL COMMENT 'Private object key or local storage path; not a public URL',
  attendance_longitude DECIMAL(10, 7) NOT NULL,
  attendance_latitude DECIMAL(10, 7) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  employee_id VARCHAR(36) NOT NULL,
  is_clock_in BOOLEAN NOT NULL DEFAULT FALSE,
  is_clock_out BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (attendance_id),
  KEY idx_attendances_employee_timestamp (employee_id, `timestamp`),
  CONSTRAINT chk_attendances_longitude
    CHECK (attendance_longitude >= -180 AND attendance_longitude <= 180),
  CONSTRAINT chk_attendances_latitude
    CHECK (attendance_latitude >= -90 AND attendance_latitude <= 90),
  CONSTRAINT chk_attendances_clock_action
    CHECK (is_clock_in <> is_clock_out),
  CONSTRAINT fk_attendances_employee
    FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

INSERT INTO roles (role_id, role_name)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'employee'),
  ('00000000-0000-4000-8000-000000000002', 'human-resources')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);
