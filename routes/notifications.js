// Feature for Notifications and Alerts

import { Router } from 'express';
import { contactMessages } from '../config/mongoCollections.js';
import { workOrders } from '../config/mongoCollections.js';
const router = Router();

// GET /api/notifications/alerts
// Get emergency alerts from contact forms
router.get('/alerts', async (req, res) => {
  try {
    const messagesCol = await contactMessages();
    const alerts = await messagesCol
      .find({ isEmergency: true })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({
      success: true,
      count: alerts.length,
      alerts: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/notifications/overdue
// Get overdue jobs still in progress
router.get('/overdue', async (req, res) => {
  try {
    const workOrdersCol = await workOrders();
    const currentDate = new Date();
    
    const overdueJobs = await workOrdersCol
      .find({
        status: 'in progress',
        completionDate: { $lt: currentDate }
      })
      .sort({ completionDate: 1 })
      .toArray();
    
    res.json({
      success: true,
      count: overdueJobs.length,
      notifications: overdueJobs
    });
  } catch (error) {
    console.error('Error fetching overdue jobs:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/notifications/all 
// Get both alerts and notifications
router.get('/all', async (req, res) => {
  try {
    const messagesCol = await contactMessages();
    const workOrdersCol = await workOrders();
    const currentDate = new Date();
    
    const alerts = await messagesCol
      .find({ isEmergency: true })
      .sort({ createdAt: -1 })
      .toArray();
    
    const overdueJobs = await workOrdersCol
      .find({
        status: 'in progress',
        completionDate: { $lt: currentDate }
      })
      .sort({ completionDate: 1 })
      .toArray();
    
    res.json({
      success: true,
      data: {
        alerts: {
          count: alerts.length,
          items: alerts
        },
        notifications: {
          count: overdueJobs.length,
          items: overdueJobs
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;