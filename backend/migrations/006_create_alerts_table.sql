-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    customer_id INTEGER,
    type VARCHAR(50) NOT NULL, -- 'info', 'success', 'warning', 'error'
    priority VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_type VARCHAR(100), -- 'rebalance', 'buy_opportunity', 'risk_management', 'report_ready', 'payment_delay', 'goal_achieved'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
