import { jobRequests, companies } from '../config/mongoCollections.js';
import { objectId } from mongodb;

const exportedMethods = {};

const checkString = (val, varName) => {
  if (typeof val !== 'string') throw `${varName} must be a string`;
  const trimmed = val.trim();
  if (trimmed.length === 0) throw `${varName} cannot be empty`;
  return trimmed;
};

const checkState = (state) => {
  const trimmed = checkString(state, 'state');
  if (!/^[A-Za-z]{2}$/.test(trimmed)) throw 'state must be 2 letters only.';
  return trimmed.toUpperCase();

  const checkZip = (zip) => {
    if (typeof zip === 'string') {
      const t = checkString(zip, 'zipCode');
      if (!/^\d{5}$/.test(t)) throw 'zipCode must be 5 digits';
      return number(t);
    }
    if (typeof zip !== 'number' || !Number.isInteger(zip)) throw 'zipCode must be an integer';

    return zip
  }
}
