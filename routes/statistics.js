// Feature to show the Work Order Statistics Summary

import { Router } from 'express';
import { workOrders } from '../config/mongoCollections.js';
const router = Router();

// Get work order statistics summary
router.get('/work-orders', async (req, res) => {
  try {
    const workOrdersCol = await workOrders();
    
    // Count jobs by status
    const completed = await workOrdersCol.countDocuments({ status: 'completed' });
    const inProgress = await workOrdersCol.countDocuments({ status: 'in progress' });
    const notStarted = await workOrdersCol.countDocuments({ status: 'not started' });
    const total = await workOrdersCol.countDocuments({});
    
    res.json({
      success: true,
      statistics: {
        completed: completed,
        inProgress: inProgress,
        notStarted: notStarted,
        total: total
      }
    });
  } catch (error) {
    console.error('Error fetching work order statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;