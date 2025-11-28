import express from 'express';
const app = express();
import configRoutes from './routes/index.js';

app.use(express.json());

configRoutes(app);

app.listen(3000, () => {
    console.log('we have a server, routes will be running on http://localhost:3000');
});