import {jobRequests} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

const exportedMethods = {};

// get all job requests
exportedMethods.getAllJobRequests = async () => {
    const jobRequestsCol = await jobRequests();
    const allJobRequests= await jobRequestsCol.find({}).toArray();
    return allJobRequests;
};

// get job request by id
exportedMethods.getJobRequestById = async (id) => {
    if (!id) throw 'must provide job request id';
    if (typeof id !== 'string') throw 'id must be a string';
    
    const trimmedId = id.trim();
    if (trimmedId.length === 0) throw 'id cannot be empty';
    if (!ObjectId.isValid(trimmedId)) throw 'invalid job request id';

    const objId = new ObjectId(trimmedId);
    const jobRequestsCol = await jobRequests();
    const jobRequest=await jobRequestsCol.findOne({_id: objId});
    
    if (!jobRequest) throw 'job request not found';
    return jobRequest;
};

// get job requests by priority
exportedMethods.getJobRequestsByPriority = async (priority) => {
    if (!priority) throw 'must provide priority';
    if (typeof priority !== 'string') throw 'priority must be a string';

    const trimmedPriority = priority.trim().toLowerCase();
    if (trimmedPriority.length === 0) throw 'priority cannot be empty';
    
    const validPriorities= ['low', 'medium', 'high'];
    if (!validPriorities.includes(trimmedPriority)) throw 'invalid priority';

    const jobRequestsCol=await jobRequests();
    const priorityJobRequests = await jobRequestsCol.find({priority: trimmedPriority}).toArray();
    
    return priorityJobRequests;
};

// get job requests by category
exportedMethods.getJobRequestsByCategory = async (category) => {
    if (!category) throw 'must provide category';
    if (typeof category !== 'string') throw 'category must be a string';
    
    const trimmedCategory = category.trim().toLowerCase();
    if (trimmedCategory.length === 0) throw 'category cannot be empty';

    const jobRequestsCol = await jobRequests();
    const categoryJobRequests = await jobRequestsCol.find({category: trimmedCategory}).toArray();
    
    return categoryJobRequests;
};

export default exportedMethods;