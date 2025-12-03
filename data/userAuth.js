import bcrypt from 'bcrypt';
import {userAuth} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

const exportedMethods = {};

//helper functions for checking values 
const checkString = (val, varName) => {
    if (typeof val !== 'string') throw `${varName} must be a string`;

    const trimmed = val.trim();
    if (trimmed.length === 0) `${varName} cannot be an empty string or just spaces`;
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