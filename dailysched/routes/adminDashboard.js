import {Router} from 'express';
import workOrdersData from '../data/workOrders.js';
import jobRequestsData from '../data/jobRequests.js';
import usersData from '../data/users.js';

const router = Router();

// middleware to check if user is logged in
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).render('error', {
            title: 'Access Denied',
            error: 'Admin access required',
            layout: 'mainLayout'
        });
    }
    next();
};

// main dashboard route redirects based on role
router.get('/dashboard', requireAuth, (req, res) => {
    if (req.session.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    } else if (req.session.user.role === 'contractor') {
        return res.redirect('/contractor/dashboard');
    } else {
        return res.status(403).send('Invalid user role');
    }
});

// admin dashboard
router.get('/admin/dashboard', requireAdmin, async (req, res) => {
    try {
        const workOrders = await workOrdersData.getAllWorkOrders();
        const jobRequests=await jobRequestsData.getAllJobRequests();
        
        // calculate statistics
        const stats = {
            totalJobs: workOrders.length,
            completed: workOrders.filter(wo => wo.status === 'completed').length,
            inProgress: workOrders.filter(wo => wo.status === 'in progress').length,
            notStarted: workOrders.filter(wo => wo.status === 'not started').length,
            pendingRequests: jobRequests.length
        };
        
        // get contractor names for display
        const workOrdersWithNames = await Promise.all(workOrders.map(async (wo) => {
            try {
                const contractor = await usersData.getUserById(wo.assignedContractorId.toString());
                return {
                    ...wo,
                    contractorName: `${contractor.firstName} ${contractor.lastName}`,
                    _id: wo._id.toString()
                };
            } catch (e) {
                return {
                    ...wo,
                    contractorName: 'Unassigned',
                    _id: wo._id.toString()
                };
            }
        }));
        
        return res.render('adminDashboard', {
            title: 'Admin Dashboard',
            user: req.session.user,
            workOrders: workOrdersWithNames,
            jobRequests: jobRequests.map(jr => ({...jr, _id: jr._id.toString()})),
            stats,
            layout: 'mainLayout'
        });
    } catch (e){
        console.error('Error loading admin dashboard:', e);
        return res.status(500).render('error', {
            title: 'Error',
            error: 'Could not load dashboard',
            layout: 'mainLayout'
        });
    }
});

// work order detail page
router.get('/admin/workorder/:id', requireAdmin, async (req, res) => {
    try {
        const workOrder = await workOrdersData.getWorkOrderById(req.params.id);
        const contractor= await usersData.getUserById(workOrder.assignedContractorId.toString());
        
        return res.render('workOrderDetail', {
            title: 'Work Order Details',
            user: req.session.user,
            workOrder: {
                ...workOrder,
                _id: workOrder._id.toString(),
                contractorName: `${contractor.firstName} ${contractor.lastName}`
            },
            layout: 'mainLayout'
        });
    } catch (e) {
        console.error('Error loading work order:', e);
        return res.status(404).render('error', {
            title: 'Not Found',
            error: 'Work order not found',
            layout: 'mainLayout'
        });
    }
});

// update work order status
router.post('/admin/workorder/:id/status', requireAdmin, async (req, res) => {
    try {
        const {status} = req.body;
        await workOrdersData.updateWorkOrderStatus(req.params.id, status);
        return res.redirect(`/admin/workorder/${req.params.id}`);
    }catch (e){
        console.error('Error updating status:', e);
        return res.status(400).render('error', {
            title: 'Error',
            error: e.toString(),
            layout: 'mainLayout'
        });
    }
});

export default router;