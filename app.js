import express from 'express';
import session from 'express-session';
const app = express();
import configRoutes from './routes/index.js';

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

configRoutes(app);

app.listen(3000, () => {
    console.log('we have a server, routes will be running on http://localhost:3000');
});