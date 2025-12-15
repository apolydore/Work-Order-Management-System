import {Router} from 'express';
import invoicesData from '../data/invoices.js';
import workOrdersData from '../data/workOrders.js';
import chargesData from '../data/charges.js';

const router = Router();

// check if user is logged in
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// check if user is admin
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

// list all invoices
router.get('/', requireAuth, async (req, res) => {
    try {
        const invoices= await invoicesData.getAllInvoices();
        
        const invoicesWithIds = invoices.map(inv => ({
            ...inv,
            _id: inv._id.toString(),
            workOrderId: inv.workOrderId.toString()
        }));
        
        return res.render('invoiceList', {
            title: 'Invoices',
            user: req.session.user,
            invoices: invoicesWithIds,
            layout: 'mainLayout'
        });
    } catch (e) {
        console.error('Error loading invoices:', e);
        return res.status(500).render('error', {
            title: 'Error',
            error: 'Could not load invoices',
            layout: 'mainLayout'
        });
    }
});

// show create invoice form
router.get('/create/:workOrderId', requireAdmin, async (req, res) => {
    try {
        const workOrder = await workOrdersData.getWorkOrderById(req.params.workOrderId);
        const allCharges = await chargesData.getAllCharges();
        
        return res.render('createInvoice', {
            title: 'Create Invoice',
            user: req.session.user,
            workOrder: {
                ...workOrder,
                _id: workOrder._id.toString()
            },
            charges: allCharges,
            layout: 'mainLayout'
        });
    } catch (e) {
        console.error('Error loading create form:', e);
        return res.status(404).render('error', {
            title: 'Not Found',
            error: 'Work order not found',
            layout: 'mainLayout'
        });
    }
});

// create new invoice
router.post('/create', requireAdmin, async (req, res) => {
    try {
        const {workOrderId, companyName, chargeCode, quantity} = req.body;
        
        const items = [{
            chargeCode: chargeCode,
            quantity: parseInt(quantity) || 1
        }];
        
        const invoice = await invoicesData.createInvoice(
            workOrderId,
            companyName,
            [chargeCode],
            items,
            0.0875
        );
        
        return res.redirect(`/invoices/${invoice._id}`);
    } catch (e) {
        console.error('Error creating invoice:', e);
        return res.status(400).render('error', {
            title: 'Error',
            error: e.toString(),
            layout: 'mainLayout'
        });
    }
});

// view invoice detail
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const invoice = await invoicesData.getInvoiceById(req.params.id);
        
        return res.render('invoiceDetail', {
            title: 'Invoice Details',
            user: req.session.user,
            invoice: {
                ...invoice,
                _id: invoice._id.toString(),
                workOrderId: invoice.workOrderId.toString()
            },
            layout: 'mainLayout'
        });
    } catch (e) {
        console.error('Error loading invoice:', e);
        return res.status(404).render('error', {
            title: 'Not Found',
            error: 'Invoice not found',
            layout: 'mainLayout'
        });
    }
});

// update invoice status
router.post('/:id/status', requireAdmin, async (req, res) => {
    try {
        const {status} = req.body;
        await invoicesData.updateInvoice(req.params.id, {status: status});
        return res.redirect(`/invoices/${req.params.id}`);
    } catch (e) {
        console.error('Error updating invoice:', e);
        return res.status(400).render('error', {
            title: 'Error',
            error: e.toString(),
            layout: 'mainLayout'
        });
    }
});

export default router;