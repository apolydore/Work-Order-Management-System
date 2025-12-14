import { jobRequests, companies } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { validators as v } from "./validators.js";

const exportedMethods = {};

const normalize = (doc) => (doc ? { ...doc, _id: doc._id.toString() } : doc);

const ensureActiveCompany = async (companyName) => {
  const col = await companies();
  const doc = await col.findOne({
    companyName: v.checkString(companyName, "companyName"),
  });

  //changing this bc doc might be null if company doesn't exist
  if (!doc) throw "company not found";
  if (doc.isActive !== true) throw "company is inactive";
  return doc;
};

// create
exportedMethods.createJobRequest = async (
  companyName,
  category,
  priority,
  description,
  address,
  city,
  state,
  zipCode,
  attachmentUrl = null,
  requestedDate = new Date(),
  status = "pending",
) => {
  const companyDoc = await ensureActiveCompany(companyName);

  const newReq = {
    companyId: companyDoc._id,
    companyName: companyDoc.companyName,
    category: v.checkString(category, "category"),
    priority: v.priority(priority),
    description: v.checkString(description, "description"),
    address: v.checkString(address, "address"),
    city: v.checkString(city, "city"),
    state: v.checkState(state),
    zipCode: v.checkZip(zipCode),
    requestedDate: v.checkDate(requestedDate),
    createdAt: new Date(),
  };

  if (
    attachmentUrl &&
    typeof attachmentUrl === "string" &&
    attachmentUrl.trim()
  ) {
    const trimmedUrl = v.checkString(attachmentUrl, "attachmentUrl");

    //simple validation for url
    if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      throw "attachmentUrl must start with http:// or https://";
    }

    newReq.attachmentUrl = trimmedUrl;
  }

  const st = v.statusJR(status);
  if (st !== undefined) newReq.status = st;

  const col = await jobRequests();
  const insertInfo = await col.insertOne(newReq);
  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw "could not create job request";

  newReq._id = insertInfo.insertedId;
  return normalize(newReq);
};

// read
exportedMethods.getJobRequestById = async (id) => {
  console.log("getJobRequestById called with:", id);
  const objId = v.checkId(id);
  console.log("objId created", objId);
  const col = await jobRequests();
  const doc = await col.findOne({ _id: objId });
  console.log("doc found:", doc ? "yes" : "no");
  if (!doc) throw "job request not found";
  return normalize(doc);
};

// list
exportedMethods.getAllJobRequests = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = v.statusJR(filters.status);
  if (filters.companyName)
    query.companyName = v.checkString(filters.companyName, "companyName");
  if (filters.priority) query.priority = v.priority(filters.priority);
  if (filters.category)
    query.category = v.checkString(filters.category, "category");

  const col = await jobRequests();
  const docs = await col.find(query).toArray();
  return docs.map(normalize);
};

// update
exportedMethods.updateJobRequest = async (id, updates) => {
  if (!updates || typeof updates !== "object")
    throw "updates must be an object";
  const objId = v.checkId(id);

  const toSet = {};
  if (updates.companyName !== undefined) {
    const companyDoc = await ensureActiveCompany(updates.companyName);
    toSet.companyName = companyDoc.companyName;
    toSet.companyId = companyDoc._id;
  }
  if (updates.category !== undefined)
    toSet.category = v.checkString(updates.category, "category");
  if (updates.priority !== undefined)
    toSet.priority = v.priority(updates.priority);
  if (updates.description !== undefined)
    toSet.description = v.checkString(updates.description, "description");
  if (updates.address !== undefined)
    toSet.address = v.checkString(updates.address, "address");
  if (updates.city !== undefined)
    toSet.city = v.checkString(updates.city, "city");
  if (updates.state !== undefined)
    toSet.state = v.checkState(updates.state, "state");
  if (updates.zipCode !== undefined)
    toSet.zipCode = v.checkZip(updates.zipCode, "zipCode");

  if (updates.attachmentUrl !== undefined) {
    //allow to clear it by sending an empty string or null
    if (updates.attachmentUrl === null || updates.attachmentUrl === "") {
      toSet.attachmentUrl = null;
    } else {
      const trimmedUrl = v.checkString(updates.attachmentUrl, "attachmentUrl");

      if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
        throw "attachmentUrl must start with http:// or https://";
      }
      toSet.attachmentUrl = trimmedUrl;
    }
  }

  if (updates.status !== undefined) toSet.status = v.statusJR(updates.status);
  if (updates.requestedDate !== undefined)
    toSet.requestedDate = v.checkDate(updates.requestedDate);

  if (Object.keys(toSet).length === 0) throw "no valid fields to update";

  const col = await jobRequests();
  const updateInfo = await col.findOneAndUpdate(
    { _id: objId },
    { $set: toSet },
    { returnDocument: "after" },
  );
  if (!updateInfo) throw "job request not found";
  return normalize(updateInfo);
};

// delete
exportedMethods.removeJobRequest = async (id) => {
  const objId = v.checkId(id);
  const col = await jobRequests();
  const deletion = await col.findOneAndDelete({ _id: objId });
  if (!deletion.value) throw "job request not found";
  return normalize(deletion.value);
};

export default exportedMethods;
