-- Database: insurance_advisor
-- Version: 1.0.0
-- Description: Variable Insurance Advisory System Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS insurance_advisor_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE insurance_advisor_dev;

-- Users table (親・子・孫アカウント管理)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    account_type ENUM('parent', 'child', 'grandchild') NOT NULL,
    plan_type ENUM('standard', 'master', 'exceed') DEFAULT 'standard',
    parent_id INT NULL,
    customer_limit INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_account_type (account_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table (顧客情報)
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    contract_date DATE NOT NULL,
    contract_amount DECIMAL(10,2) NOT NULL,
    monthly_premium DECIMAL(10,2) NOT NULL,
    risk_tolerance ENUM('conservative', 'balanced', 'aggressive') DEFAULT 'balanced',
    investment_goal TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_contract_date (contract_date),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analysis Results table (分析結果保存)
CREATE TABLE analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    analysis_date DATE NOT NULL,
    market_data_source VARCHAR(255),
    base_allocation JSON NOT NULL,
    adjusted_allocation JSON NOT NULL,
    adjustment_factors JSON NOT NULL,
    recommendation_text TEXT,
    confidence_score DECIMAL(3,2),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_analysis_date (analysis_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Market Data table (市場データキャッシュ)
CREATE TABLE market_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_date DATE NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    source_file VARCHAR(255),
    data_content JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    UNIQUE KEY unique_data_date_type (data_date, data_type),
    INDEX idx_data_date (data_date),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Sessions table (セッション管理)
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Log table (監査ログ)
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plan Features table (プラン機能管理)
CREATE TABLE plan_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_type ENUM('standard', 'master', 'exceed') NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_value VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_plan_feature (plan_type, feature_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Plan Features Data
INSERT INTO plan_features (plan_type, feature_name, feature_value, description) VALUES
('standard', 'customer_limit', '10', 'Maximum number of customers'),
('standard', 'analysis_frequency', 'monthly', 'How often analysis can be performed'),
('standard', 'export_formats', 'pdf', 'Available export formats'),
('master', 'customer_limit', '50', 'Maximum number of customers'),
('master', 'analysis_frequency', 'weekly', 'How often analysis can be performed'),
('master', 'export_formats', 'pdf,excel', 'Available export formats'),
('exceed', 'customer_limit', '999', 'Maximum number of customers'),
('exceed', 'analysis_frequency', 'daily', 'How often analysis can be performed'),
('exceed', 'export_formats', 'pdf,excel,api', 'Available export formats');

-- Create indexes for performance
CREATE INDEX idx_users_account_plan ON users(account_type, plan_type);
CREATE INDEX idx_customers_active_user ON customers(is_active, user_id);
CREATE INDEX idx_analysis_customer_date ON analysis_results(customer_id, analysis_date DESC);

-- Initial development data will be loaded from separate file