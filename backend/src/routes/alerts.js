const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { authenticateToken } = require('../middleware/auth');

// Get all alerts for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const alerts = await Alert.getByUserId(String(req.user.id));

        // Format response to match frontend expectations
        const formattedAlerts = alerts.map(alert => ({
            id: alert.id,
            type: alert.type,
            priority: alert.priority,
            title: alert.title,
            message: alert.message,
            createdAt: alert.created_at,
            isRead: alert.is_read,
            customerId: alert.customer_id,
            customerName: alert.customer_name,
            actionType: alert.action_type
        }));

        res.json(formattedAlerts);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'アラートの取得に失敗しました' });
    }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const count = await Alert.getUnreadCount(String(req.user.id));
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: '未読件数の取得に失敗しました' });
    }
});

// Mark alert as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
    try {
        const alert = await Alert.markAsRead(req.params.id, String(req.user.id));

        if (!alert) {
            return res.status(404).json({ error: 'アラートが見つかりません' });
        }

        res.json({
            message: 'アラートを既読にしました',
            alert: {
                id: alert.id,
                isRead: alert.is_read
            }
        });
    } catch (error) {
        console.error('Error marking alert as read:', error);
        res.status(500).json({ error: 'アラートの更新に失敗しました' });
    }
});

// Mark all alerts as read
router.patch('/read-all', authenticateToken, async (req, res) => {
    try {
        await Alert.markAllAsRead(String(req.user.id));
        res.json({ message: 'すべてのアラートを既読にしました' });
    } catch (error) {
        console.error('Error marking all alerts as read:', error);
        res.status(500).json({ error: 'アラートの更新に失敗しました' });
    }
});

// Delete alert
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await Alert.delete(req.params.id, String(req.user.id));

        if (!result) {
            return res.status(404).json({ error: 'アラートが見つかりません' });
        }

        res.json({ message: 'アラートを削除しました' });
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({ error: 'アラートの削除に失敗しました' });
    }
});

// Create alert (for testing or manual creation)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const alertData = {
            user_id: String(req.user.id),
            customer_id: req.body.customerId,
            type: req.body.type || 'info',
            priority: req.body.priority || 'medium',
            title: req.body.title,
            message: req.body.message,
            action_type: req.body.actionType
        };

        const alert = await Alert.create(alertData);
        res.status(201).json(alert);
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: 'アラートの作成に失敗しました' });
    }
});

// Delete all alerts for current user (for testing)
router.delete('/all', authenticateToken, async (req, res) => {
    try {
        const db = require('../utils/database-factory');

        console.log('Delete all alerts request from user:', req.user.id, req.user.accountType);

        // If admin user, allow deleting ALL alerts (including mock data)
        if (req.user.accountType === 'admin' || req.user.accountType === 'parent') {
            console.log('Admin/Parent user - deleting ALL alerts');
            const sql = 'DELETE FROM alerts';
            const result = await db.query(sql);

            console.log('Delete result:', result);

            // Handle different database response formats
            let deletedCount = 0;
            if (result && typeof result === 'object') {
                deletedCount = result.affectedRows || result.rowCount || 0;
            }

            return res.json({
                message: 'すべてのアラートを削除しました',
                deleted: deletedCount
            });
        }

        // Otherwise only delete user's own alerts
        console.log('Regular user - deleting own alerts for user_id:', String(req.user.id));
        const sql = 'DELETE FROM alerts WHERE user_id = $1';
        const result = await db.query(sql, [String(req.user.id)]);
        res.json({
            message: 'すべてのアラートを削除しました',
            deleted: result.affectedRows || result.rowCount || 0
        });
    } catch (error) {
        console.error('Error deleting all alerts:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'アラートの削除に失敗しました',
            details: error.message
        });
    }
});

module.exports = router;
