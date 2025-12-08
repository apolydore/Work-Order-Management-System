import express from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
const app = express();
import configRoutes from './routes/index.js';
import notificationsRouter from './routes/notifications.js';

app.use(express.json());

app.use(
    session({
        name:'AuthCookie',
        secret:'secret string', //change this later
        saveUninitialized: false,
        resave: false,
    })
)

//this is a middleware that parses the form and puts it into the request body
app.use(express.urlencoded({extended: true}));

app.use(express.static('public'));

// for notifications and alerts
app.use('/api/notifications', notificationsRouter);

app.engine('handlebars', exphbs.engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('views', './views');

configRoutes(app);

app.listen(3000, () => {
    console.log('we have a server, routes will be running on http://localhost:3000');
});