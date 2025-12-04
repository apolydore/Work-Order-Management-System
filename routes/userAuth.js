import {Router} from 'express'; 
import userAuthData from '../data/userAuth.js';
import usersData from '../data/users.js';

const router = Router();

//if the user is already logged in, send them to the dashboard
//if not, direct them to login page
router.get('/login', (req, res) => {
    if (req.session.user){
        return res.redirect('/dashboard');
    }

    //uses the main handlebars, the title here is to be used in the title tag in main
    return res.render('login', {title: 'Log In', layout:'loginLayout'});
});

//if user passes checks and logs in, redirect them to dashboard 
router.post('/login', async (req, res) => {
    const {email, password} = req.body; 

    try {
        const {userId} = await userAuthData.checkUser(email, password);
        const user = await usersData.getUserById(userId.toString());

        //this stores the user in the session so we know who is logged in
        req.session.user = {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName, 
            role: user.role 
        };

        return res.redirect('/dashboard'); //this will use the dashboard handlebars layout
    } catch (e){
        //if anything is wrong with login input, re-render login page with an error
        return res.status(400).render('login', {title: 'Log In', layout: 'loginLayout',error: e});
    }
});

//this destroys current session and logs the user out, after logged out, send user back
//to login screen 
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

export default router; 