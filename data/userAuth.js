import bcrypt from 'bcrypt';
import {userAuth} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

const exportedMethods = {};

//helper functions for checking values 
const checkString = (val, varName) => {
    if (typeof val !== 'string') throw `${varName} must be a string`;

    const trimmed = val.trim();
    if (trimmed.length === 0) throw `${varName} cannot be an empty string or just spaces`;
    return trimmed; 
}

const checkEmail = (email) => {
    const trimmed = checkString(email, 'email').toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) throw 'email is not a valid email address';
    return trimmed; 
}

//checking password, must be at least 8 characters
const checkPassword = (password) => {
    const trimmed = checkString(password, 'password');
    if (trimmed.length < 8) throw 'password must be at least 8 characters long';
    //dont let the password contain spaces
    if (/\s/.test(trimmed)) throw 'password cannot contain spaces';
    return trimmed;
}

//check userId if it is a valid ObjectId
const checkUserId = (userId) => {
    if (typeof userId !== 'string') throw 'userId must be a string';
    const trimmed = userId.trim();
    if (trimmed.length === 0) throw 'userId cannot be an empty string or just spaces';
    if (!ObjectId.isValid(trimmed)) throw 'invalid userId';

    return new ObjectId(trimmed);
}

//data functions here now
//this one is called after you create a new user
exportedMethods.createAuthRecord = async (userId, email, password) => {
    if (userId === undefined || email === undefined || password === undefined) throw 'userId, email, and password are all required fields';

    const checkedUserId = checkUserId(userId);
    const checkedEmail = checkEmail(email);
    const checkedPassword = checkPassword(password);

    const authCol = await userAuth();

    const existing = await authCol.findOne({email: checkedEmail});
    if (existing) throw 'an account with this email already exists';

    const hashedPassword = await bcrypt.hash(checkedPassword, 13);

    const newAuthRec = {
        userId: checkedUserId,
        email: checkedEmail,
        hashedPassword,
        createdAt: new Date()
    };

    const insertInfo = await authCol.insertOne(newAuthRec);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'could not create authorization record';

    newAuthRec._id = insertInfo.insertedId;
    return newAuthRec; 
};

exportedMethods.checkUser = async (email, password) => {
    if (email === undefined || password === undefined) throw 'email and password are required';

    const checkedEmail = checkEmail(email);
    const checkedPassword = checkPassword(password);

    const authCol = await userAuth();
    const authRecord = await authCol.findOne({email: checkedEmail});

    if (!authRecord) throw 'either the email or password is invalid';

    const match = await bcrypt.compare(checkedPassword, authRecord.hashedPassword);
    if (!match) throw 'either the email or password is invalid';

    //returning the userId so that the route can find and get the user profile
    return {userId: authRecord.userId};
};

export default exportedMethods; 
