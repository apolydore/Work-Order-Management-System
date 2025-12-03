import {users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

const exportedMethods = {};

//some helper functions for checking
//check if a string
const checkString = (val, varName) => {
    if (typeof val !== 'string') throw `${varName} must be a string`;
    const trimmed = val.trim();
    if (trimmed.length === 0) throw `${varName} cannot be an empty string or just spaces`;
    return trimmed; 
}

//check if only has alphabet characters
const checkAlpha = (val, varName) => {
    const trimmed = checkString(val, varName);
    //regex to check alphabet characters
    if (!/^[A-Za-z]+$/.test(trimmed)) throw `${varName} must contain only alphabetic characters`;
    return trimmed;
}

//for first name and last name, check only letters and between 2-50 characters
const checkName = (name, fieldName) => {
    const trimmed = checkString(name, fieldName);
    if (!/^[A-Za-z \-]+$/.test(trimmed)) throw `${fieldName} may only contain letters, spaces, and hyphens`;
    if (!/[A-Za-z]/.test(trimmed)) throw `${fieldName} must contain at least one letter`;
    if (trimmed.length <2 || trimmed.length > 50) throw `${fieldName} must be between 2 and 50 characters long`;
    return trimmed; 
}

//for role and city, ensure only letters
const checkRole = (role) => {
    const trimmed = checkAlpha(role, 'role');
    return trimmed.toLowerCase();
}

const checkCity = (city) => {
    const trimmed = checkString(city, 'city');
    if (!/^[A-Za-z .]+$/.test(trimmed)) throw 'city may only contain letters, spaces, and period';
    if (!/[A-Za-z]/.test(trimmed)) throw 'city must contain at least one letter';
    return trimmed; 
}

//for state, only two letters allowed
const checkState = (state) => {
    const trimmed = checkString(state, 'state');
    if (!/^[A-Za-z]{2}$/.test(trimmed)) throw 'state must be two alphabetic characters (e.g. "NJ")';
    return trimmed.toUpperCase();
}

const checkPhone = (phone) => {
    const trimmed = checkString(phone, 'phone');
    if (!/^\d{3}-\d{3}-\d{4}$/.test(trimmed)) throw 'phone number must be in the format of 000-000-0000';
    return trimmed; 
}

const checkSkills = (skills) => {
    if (!Array.isArray(skills)) throw 'skills must be an array';
    if (skills.length === 0) throw 'skills array must contain at least one skill';

    //this makes error checking a little easier, index of each skill mapped, then normalize
    const normSkills = skills.map((skill, indx) => {
        const label = `skills[${indx}]`;
        const trimmed = checkAlpha(skill, label);
        return trimmed.toLowerCase;
    });

    return normSkills; 
}

//creating the user here
exportedMethods.createUser = async (role, firstName, lastName, city, state, phone, skills) => {
    if (
        role === undefined ||
        firstName === undefined ||
        lastName === undefined ||
        city === undefined ||
        state === undefined ||
        phone === undefined ||
        skills === undefined
    ) {
        throw 'All fields must be filled out!'
    }

    //validating each field 
    const checkedRole = checkRole(role);
    const checkedFirstName = checkName(firstName, 'firstName');
    const checkedLastName = checkName(lastName, 'lastName');
    const checkedCity = checkCity(city);
    const checkedState = checkState(state);
    const checkedPhone = checkPhone(phone);
    const checkedSkills = checkSkills(skills);

    const usersCol = await users();

    const newUser = {
        role: checkedRole,
        firstName: checkedFirstName,
        lastName: checkedLastName,
        city: checkedCity,
        state: checkedState,
        phone: checkedPhone,
        skills: checkedSkills
    };

    const insertInfo = await usersCol.insertOne(newUser); 
    //did mongodb acknowledge the insert or did we not get back an id, if so throw error
    if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'could not create user';

    newUser._id = insertInfo.insertedId;
    return newUser;
};

exportedMethods.getUserById = async (id) => {
    if (!id) throw 'You must provide an id';
    if (typeof id !== 'string') throw 'id must be a string';
    const trimmed = id.trim();
    if (trimmed.length === 0) throw 'id cannot be an empty string or just spaces';

    if (!ObjectId.isValid(trimmed)) throw 'invalid user id';

    const objId = new ObjectId(trimmed);

    const usersCol = await users();
    const user = await usersCol.findOne({_id: objId});
    if (!user) throw 'user not found';
    return user; 
};

export default exportedMethods; 