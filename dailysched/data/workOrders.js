import {workOrders} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

const exportedMethods = {};

// get all work orders
exportedMethods.getAllWorkOrders = async () => {
    const workOrdersCol = await workOrders();
    const allWorkOrders = await workOrdersCol.find({}).toArray();
    return allWorkOrders;
};

// get work order by id
exportedMethods.getWorkOrderById = async (id) => {
    if (!id) throw 'must provide work order id';
    if (typeof id !== 'string') throw 'id must be a string';
    
    const trimmedId=id.trim();
    if (trimmedId.length === 0) throw 'id cannot be empty';
    if (!ObjectId.isValid(trimmedId)) throw 'invalid work order id';

    const objId = new ObjectId(trimmedId);
    const workOrdersCol = await workOrders();
    const workOrder = await workOrdersCol.findOne({_id: objId});
    
    if (!workOrder) throw 'work order not found';
    return workOrder;
};

// get work orders by contractor
exportedMethods.getWorkOrdersByContractor = async (contractorId) => {
    if (!contractorId) throw 'must provide contractor id';
    if (typeof contractorId !== 'string') throw 'contractor id must be a string';
    
    const trimmed = contractorId.trim();
    if (trimmed.length === 0) throw 'contractor id cannot be empty';
    if (!ObjectId.isValid(trimmed)) throw 'invalid contractor id';

    const objId = new ObjectId(trimmed);
    const workOrdersCol = await workOrders();
    const contractorWorkOrders = await workOrdersCol.find({assignedContractorId: objId}).toArray();
    
    return contractorWorkOrders;
};

// get work orders by status
exportedMethods.getWorkOrdersByStatus = async (status) => {
    if (!status) throw 'must provide status';
    if (typeof status !== 'string') throw 'status must be a string';
    
    const trimmedStatus = status.trim().toLowerCase();
    if (trimmedStatus.length === 0) throw 'status cannot be empty';
    
    const validStatuses= ['not started', 'in progress', 'completed'];
    if (!validStatuses.includes(trimmedStatus)) throw 'invalid status';

    const workOrdersCol = await workOrders();
    const statusWorkOrders = await workOrdersCol.find({status: trimmedStatus}).toArray();
    
    return statusWorkOrders;
};

// update work order status
exportedMethods.updateWorkOrderStatus = async (id, newStatus) => {
    if (!id || !newStatus) throw 'must provide id and status';
    if (typeof id !== 'string' || typeof newStatus !== 'string') throw 'id and status must be strings';
    
    const trimmedId= id.trim();
    const trimmedStatus = newStatus.trim().toLowerCase();
    
    if (trimmedId.length === 0 || trimmedStatus.length === 0) throw 'id and status cannot be empty';
    if (!ObjectId.isValid(trimmedId)) throw 'invalid work order id'; 
    const validStatuses = ['not started', 'in progress', 'completed'];
    if (!validStatuses.includes(trimmedStatus)) throw 'invalid status';

    const objId=new ObjectId(trimmedId);
    const workOrdersCol = await workOrders();
    
    const updateInfo = await workOrdersCol.updateOne(
        {_id: objId},
        {$set: {status: trimmedStatus}}
    );
    
    if (updateInfo.modifiedCount === 0) throw 'could not update work order status';
    return await exportedMethods.getWorkOrderById(trimmedId);
};

export default exportedMethods;