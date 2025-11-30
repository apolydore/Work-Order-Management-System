import express from 'express';
const app = express();
import configRoutes from './routes/index.js';

app.use(express.json());

//this is a middleware that parses the form and puts it into the request body
app.use(express.urlencoded({extended: true}));

app.use(express.static('public'));

configRoutes(app);

app.listen(3000, () => {
    console.log('we have a server, routes will be running on http://localhost:3000');
});