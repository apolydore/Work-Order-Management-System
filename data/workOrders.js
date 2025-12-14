import { workOrders, jobRequests, users } from "../config/mongoCollections.js";
import { validators as v } from "./validators.js";

const exportedMethods = {};

const normalize = (doc) => {
  if (!doc) return doc;

  const out = {
    ...doc,
    _id: doc._id.toString(),
    jobRequestId: doc.jobRequestId.toString(),
    comments: Array.isArray(doc.comments)
      ? doc.comments.map((c) => ({
          ...c,
          _id: c._id ? (c._id.toString ? c._id.toString() : c._id) : undefined,
        }))
      : [],
  };

  if (doc.assignedContractorId) {
    out.assignedContractorId = doc.assignedContractorId.toString();
  } else {
    out.assignedContractorId = null;
  }

  return out;
};

const ensureJobRequest = async (id) => {
  const col = await jobRequests();
  const doc = await col.findOne({ _id: v.checkId(id, "jobRequestId") });
  if (!doc) throw "job request not found";
  return doc;
};

const ensureContractor = async (id) => {
  if (id === undefined || id === null) return null;
  const col = await users();
  const doc = await col.findOne({ _id: v.checkId(id, "assignedContractorId") });
  if (!doc) throw "contractor not found";
  if (doc.role !== "contractor") throw "assigned user must be a contractor";
  return doc;
};

const checkNum = (val, name) => {
  if (val === null || val === undefined) return null;
  if (typeof val !== "number" || Number.isNaN(val))
    throw `${name} must be a number`;
  return val;
};

const buildToSet = async (updates) => {
  const toSet = {};

  if (updates.assignedContractorId !== undefined) {
    if (updates.assignedContractorId === null) {
      toSet.assignedContractorId = null;
    } else {
      await ensureContractor(updates.assignedContractorId);
      toSet.assignedContractorId = v.checkId(
        updates.assignedContractorId,
        "assignedContractorId",
      );
    }
  }

  // validator map
  const fields = {
    companyName: (value) => v.checkString(value, "companyName"),
    priority: (value) => v.priority(value),
    description: (value) => v.checkString(value, "description"),
    address: (value) => v.checkString(value, "address"),
    city: (value) => v.checkString(value, "city"),
    state: (value) => v.checkState(value),
    zipCode: (value) => v.checkZip(value),
    status: (value) => statusWO(value),
    startDate: (value) => v.checkDate(value, "startDate"),
    estimatedEndDate: (value) => v.checkDate(value, "estimatedEndDate"),
    latitude: (value) => (value === null ? null : checkNum(value, "latitude")),
    longitude: (value) =>
      value === null ? null : checkNum(value, "longitude"),
    comments: (value) => {
      if (!Array.isArray(value)) throw "comments must be an array";
      return value.map((c, i) => v.commentObj(c, `comments[${i}]`));
    },
  };
  for (const [key, fn] of Object.entries(fields)) {
    if (updates[key] !== undefined) toSet[key] = fn(updates[key]);
  }

  return toSet;
};

// create
exportedMethods.createWorkOrder = async (
  jobRequestId,
  companyName,
  assignedContractorId = null,
  priority,
  description,
  address,
  city,
  state,
  zipCode,
  latitude = null,
  longitude = null,
  status = "open",
  startDate = new Date(),
  estimatedEndDate = null,
  comments = [],
) => {
  await ensureJobRequest(jobRequestId);
  await ensureContractor(assignedContractorId);

  const newWO = {
    jobRequestId: v.checkId(jobRequestId, "jobRequestId"),
    companyName: v.checkString(companyName, "companyName"),
    assignedContractorId: assignedContractorId
      ? v.checkId(assignedContractorId, "assignedContracorId")
      : null,
    priority: v.priority(priority),
    description: v.checkString(description, "description"),
    address: v.checkString(address, "address"),
    city: v.checkString(city, "city"),
    state: v.checkState(state),
    zipCode: v.checkZip(zipCode),
    latitude: checkNum(latitude, "latitude"),
    longitude: checkNum(longitude, "longitude"),
    status: v.statusWO(status),
    startDate: v.checkDate(startDate, "startDate"),
    estimatedEndDate: estimatedEndDate
      ? v.checkDate(estimatedEndDate, "estimatedEndDate")
      : null,
    comments: Array.isArray(comments)
      ? comments.map((c, i) => v.commentObj(c, `comments[${i}]`))
      : [],
    createdAt: new Date(),
  };

  const col = await workOrders();
  const insertInfo = await col.insertOne(newWO);
  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw "could not create work order";

  newWO._id = insertInfo.insertedId;
  return normalize(newWO);
};

// read
exportedMethods.getWorkOrderById = async (id) => {
  const objId = v.checkId(id);
  const col = await workOrders();
  const doc = await col.findOne({ _id: objId });
  if (!doc) throw "work order not found";
  return normalize(doc);
};

// list
exportedMethods.getWorkOrders = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = v.statusWO(filters.status);
  if (filters.contractorId)
    query.assignedContractorId = v.checkId(
      filters.contractorId,
      "contractorId",
    );
  if (filters.jobRequestId)
    query.jobRequestId = v.checkId(filters.jobRequestId, "jobRequestId");
  if (filters.priority) query.priority = v.priority(filters.priority);

  const col = await workOrders();
  const docs = await col.find(query).toArray();
  return docs.map(normalize);
};

// update
exportedMethods.updateWorkOrder = async (id, updates) => {
  if (!updates || typeof updates !== "object")
    throw "updates must be an object";

  const objId = v.checkId(id);
  const toSet = await buildToSet(updates);

  if (Object.keys(toSet).length === 0) throw "no updates to apply";

  const col = await workOrders();
  const updateInfo = await col.findOneAndUpdate(
    { _id: objId },
    { $set: toSet },
    { returnDocument: "after" },
  );
  if (!updateInfo) throw "work order not found";
  return normalize(updateInfo);
};

// add comment
exportedMethods.addComment = async (workOrderId, commentObj) => {
  const objId = v.checkId(workOrderId, "workOrderId");
  const comment = v.commentObj(commentObj, "comment");

  const col = await workOrders();
  const updateInfo = await col.findOneAndUpdate(
    { _id: objId },
    { $push: { comments: comment } },
    { returnDocument: "after" },
  );
  if (!updateInfo.value) throw "work order not found";
  return normalize(updateInfo.value);
};

//delete
exportedMethods.removeWorkOrder = async (id) => {
  const objId = v.checkId(id);
  const col = await workOrders();
  const deletion = await col.findOneAndDelete({ _id: objId });
  if (!deletion.value) throw "work order not found";
  return normalize(deletion.value);
};

export default exportedMethods;
