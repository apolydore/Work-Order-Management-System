import { charges } from "../config/mongoCollections.js";
import { validators as v } from "../data/validators.js";

const exportedMethods = {};

const normalize = (doc) => (doc ? { ...doc, _id: doc._id.toString() } : doc);

exportedMethods.createCharge = async (
  _id,
  category,
  description,
  avgCharge,
  lastUpdated = new Date(),
) => {
  const newCharge = {
    _id: v.checkString(_id, "_id"),
    category: v.checkString(category, "category"),
    description: v.checkString(description, "description"),
    avgCharge: v.money(avgCharge, "avgCharge"),
    lastUpdated: v.checkDate(lastUpdated, "lastUpdated"),
  };

  const col = await charges();
  const existing = await col.findOne({ _id: newCharge._id });
  if (existing) throw "charge code already exists";

  const insertInfo = await col.insertOne(newCharge);
  if (!insertInfo.acknowledged) throw "could not create charge";

  return normalize(newCharge);
};

exportedMethods.getChargeById = async (id) => {
  const chargeId = v.checkString(id, "id");
  const col = await charges();
  const doc = await col.findOne({ _id: chargeId });
  if (!doc) throw "charge not found";
  return normalize(doc);
};

exportedMethods.getAllCharges = async (filters = {}) => {
  const query = {};
  if (filters.category)
    query.category = v.checkString(filters.category, "category");

  const col = await charges();
  const docs = await col.find(query).toArray();
  return docs.map(normalize);
};

exportedMethods.updateCharge = async (id, updates) => {
  if (!updates || typeof updates !== "object")
    throw "updates must be an object";
  const chargeId = v.checkString(id, "id");

  const toSet = {};
  if (updates.category !== undefined)
    toSet.category = v.checkString(updates.category, "category");
  if (updates.description !== undefined)
    toSet.description = v.checkString(updates.description, "description");
  if (updates.avgCharge !== undefined)
    toSet.avgCharge = v.money(updates.avgCharge, "avgCharge");
  if (updates.lastUpdated !== undefined)
    toSet.lastUpdated = v.checkDate(updates.lastUpdated, "lastUpdated");

  if (Object.keys(toSet).length === 0) throw "no valid fields to update";

  const col = await charges();
  const updateInfo = await col.findOneAndUpdate(
    { _id: chargeId },
    { $set: toSet },
    { returnDocument: "after" },
  );

  if (!updateInfo.value) throw "charge not found";

  return normalize(updateInfo.value);
};

exportedMethods.removeCharge = async (id) => {
  const chargeId = v.checkString(id, "id");
  const col = await charges();
  const deletion = await col.findOneAndDelete({ _id: chargeId });
  if (!deletion.value) throw "charge not found";
  return normalize(deletion.value);
};

export default exportedMethods;
