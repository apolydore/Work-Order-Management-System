import {dbConnection} from './mongoConnection.js';

const getCollectionFn = (collection) =>{
    let _col = undefined;

    return async () => {
        if (!_col) {
            const db = await dbConnection();
            _col = await db.collection(collection);
        }

        return _col; 
    };
}; 

export const users = getCollectionFn('users');
export const userAuth = getCollectionFn('userAuth');
export const companies = getCollectionFn('companies');
export const jobRequests = getCollectionFn('jobRequests');
export const workOrders = getCollectionFn('workOrders');
export const invoices = getCollectionFn('invoices');
export const charges = getCollectionFn('charges');
export const contactMessages = getCollectionFn('contactMessages');