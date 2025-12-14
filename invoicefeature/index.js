import contactRoutes from './contact.js';
import userAuthRoutes from './userAuth.js';
import adminDashboardRoutes from './adminDashboard.js';
import scheduleRoutes from './schedule.js';
import invoiceRoutes from './invoices.js';

const constructorMethod = (app) => {
    // contact form routes
    app.use('/', contactRoutes);
    
    // authentication routes
    app.use('/', userAuthRoutes);
    
    // admin dashboard routes
    app.use('/', adminDashboardRoutes);
    
    // schedule routes
    app.use('/', scheduleRoutes);
    
    // invoice routes
    app.use('/invoices', invoiceRoutes);

    // 404 handler
    app.use('*', (req, res) => {
        return res.status(404).render('error', {
            title: '404 - Not Found',
            error: 'Page not found',
            layout: 'mainLayout'
        });
    });
};

export default constructorMethod;