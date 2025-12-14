//this file will handle the contact us form submissions from the index.html page
//it handles them by storing them in mongodb

import {Router} from 'express';
import {contactMessages} from '../config/mongoCollections.js';
const router = Router();

//this is to match the <form action="/contact" method="POST"> in the index.html page
router.post('/', async (req, res) => {
    try{
        const {name, email, category, message} = req.body;

        //figure out how to highlight those fields in css
        if (!name || !email || !message) {
            return res.status(400).json({success: false, error: 'Missing required fields!'});
        }

        const messagesCol = await contactMessages();

        //category otherwise use inquiry as the default
        const normCategory = (category || 'inquiry').trim();

        const messageData = {
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
            category: normCategory,
            isEmergency: normCategory==='emergency', 
            createdAt: new Date()
        };

        await messagesCol.insertOne(messageData);

        //after saving, just show that it was submitted
        //return the json so that ajax can show the thank you page
        return res.status(200).json({success:true});
    } catch (e) {
        console.error('Error saving message: ', e);
        return res.status(500).json({success: false, error: e.toString()});
    }
});

//this is the helper for the admin page to show the messages to them
export const getMessages = async () => {
    const messagesCol = await contactMessages();
    return messagesCol.find({}).sort({createdAt: -1}).toArray();
};

export default router; 

