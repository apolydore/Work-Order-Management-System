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

        //path to respective dashboards depending on whether a contractor or admin
        const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';

        return res.redirect(dashboardPath); //this will use the dashboard handlebars layout
    } catch (e){
        //if anything is wrong with login input, re-render login page with an error
        return res.status(400).render('login', {title: 'Log In', layout: 'loginLayout',error: e});
    }
});

//putting the signup down here
router.get('/signup', (req, res) => {
    //if they are already logged in, no need to sign up
    if (req.session.user){
        return res.redirect('/dashboard');
    }

    return res.render('signup', {title: 'Create Account', layout:'loginLayout'});
});

//we have to create both a user profile in users.js and also an authorization record in userAuth collection
router.post('/signup', async (req, res) => {
    //hardcode role so that public can only sign up as a contractor 
    const role = 'contractor';

    const {
        firstName,
        lastName,
        city,
        state,
        phone,
        skills, //has to be separated by commas in input field
        email,
        password,
        confirmPassword
    } = req.body;

    //have to keep the filled in data in the form if there is an error
    const viewData = {
        title: 'Create Account',
        form: {
            role,
            firstName,
            lastName,
            city,
            state,
            phone,
            skills,
            email
        }
    };

    //checking if fields are filled in
    if (
        !firstName ||
        !lastName ||
        !city ||
        !state ||
        !phone ||
        !skills ||
        !email ||
        !password ||
        !confirmPassword
    ) {
        return res.status(400).render('signup', {
            title: viewData.title,
            layout: 'loginLayout',
            form: viewData.form,
            error: 'All fields are required'
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).render('signup', {
            title: viewData.title,
            layout: 'loginLayout',
            form: viewData.form,
            error: 'passwords must match'
        });
    }

    //converting the skills input, separated by commas, make sure it is trimmed and greater than 0 chars
    const skillsArray = skills.split(',').map((s) => s.trim()).filter((s) => s.length>0);

    try {
        //try to create the user
        const newUser = await usersData.createUser(
            role,
            firstName,
            lastName,
            city,
            state,
            phone,
            skillsArray
        );

        //create the auth record with a hashed password
        await userAuthData.createAuthRecord(newUser._id.toString(), email, password);

        //then we log them in immediately after making an account, redirect to dashboard
        req.session.user = {
            _id: newUser._id.toString(),
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role
        }; 

        return res.redirect('/dashboard');
    } catch (e) {
        return res.status(400).render('signup', {
            title: viewData.title,
            layout: 'loginLayout',
            form: viewData.form,
            error: e
        });
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