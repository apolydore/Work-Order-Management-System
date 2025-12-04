// companies collection 
// for validating jobRequests and for invoices

import { companies } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const exportedMethods = {};

const checkString = (val, varName) => {
  if (typeof val !== 'string') throw `${varName} must be a string`;
  const trimmed = val.trim();
  if (trimmed.length === 0) throw `${varName} cannot be empty`;
  
  return trimmed;
};

const checkState = (state) => {
  const trimmed = checkString(state, 'state');
  if (!/^[A-Za-z]{2}$/.test(trimmed)) throw 'state must be 2 letters';
  
  return trimmed.toUpperCase();
};

const checkZip = (zip) => {
  if (typeof zip === 'string') {
    const t = checkString(zip, 'zipCode');
    if (!/^\d{5}$/.test(t)) throw 'zipCode must be 5 digits';
    return Number(t);
  }
  if (typeof zip !== 'number' || !Number.isInteger(zip)) throw 'zipCode must be an integer';
  if (zip < 0) throw 'zipCode must be positive';
  return zip;
};

const checkPhone = (phone) => {
  const trimmed = checkString(phone, 'phone');
  if (!/^\d{3}-\d{3}-\d{4}$/.test(trimmed)) throw 'phone must be in 000-000-0000 format';
  return trimmed;
};

const checkEmail = (email) => {
  const trimmed = checkString(email, 'email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) throw 'invalid email address';
  
  return trimmed;
};

const checkPrimaryContact = (pc) => {
  if (!pc || typeof pc !== 'object' || Array.isArray(pc)) throw 'primaryContact must be an object';
  return {
    name: checkString(pc.name, 'primaryContact.name'),
    email: checkEmail(pc.email),
    phone: checkPhone(pc.phone),
    title: checkString(pc.title, 'primaryContact.title')
  };
};

const checkId = (id) => {
  const trimmed = checkString(id, 'id');
  if (!ObjectId.isValid(trimmed)) throw 'invalid id';
    return new ObjectId(trimmed);
};

// createCompany:
// enforces required fields and blocks duplicate companyName

exportedMethods.createCompany = async (
  companyName,
  website,
  address,
  city,
  state,
  zipCode,
  primaryContact,
  isActive = true
) => {
  const newCompany = {
    companyName: checkString(companyName, 'companyName'),
    website: website ? checkString(website, 'website') : '', 
    address: checkString(address, 'address'),
    city: checkString(city, 'city'),
    state: checkState(state),
    zipCode: checkZip(zipCode),
    primaryContact: checkPrimaryContact(primaryContact),
    isActive: Boolean(isActive)
  };
  const col = await companies();

  const existing = await col.findOne({companyName: newCompany.companyName });
  if (existing) throw 'company already exists';

  const insertInfo = await col.insertOne(newCompany);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'could not create company';

  newCompany._id = insertInfo.insertedId;
  return newCompany;
};

exportedMethods.getCompanyById = async (id) => {
  const objId = checkId(id);
  const col = await companies();
  const doc = await col.findOne({ _id: objId});
  if (!doc) throw 'company not found';
  return doc;
};

// getCompanyByName:
// used by jobRequest to verify a submitted company is real or active.
// companies will be seeded so the job request form will only allow requests from companies that exist + are active
exportedMethods.getCompanyByName = async (companyName) => {
  const name = checkString(companyName, 'companyName');
  const col = await companies();
  const doc = await col.findOne({ companyName: name });
if (!doc) throw 'company not found';
  return doc;
};

exportedMethods.getActiveCompanyByName = async (companyName) => {
  const doc = await exportedMethods.getCompanyByName(companyName);
  if (!doc.isActive) throw 'company is inactive';
  return doc;
};

exportedMethods.getAllCompanies = async () => {
  const col = await companies();
  return col.find({}).toArray();
};

export default exportedMethods;





