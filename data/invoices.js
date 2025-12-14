import { invoices, workOrders, charges } from "../config/mongoCollections.js";
import { validators as v } from "./validators.js";

const exportedMethods = {};

const normalize = (doc) => {
  if (!doc) return doc;
  return {
    ...doc,
    _id: doc._id.toString(),
    workOrderId: doc.workOrderId.toString(),
  };
};

const statusInvoice = (val) => {
  if (val === undefined || val === null) return "draft";
  const trimmed = v.checkString(val, "status").toLowerCase();
  const allowed = ["draft", "issued", "paid", "cancelled"];
  if (!allowed.includes(trimmed))
    throw `invoice status must be one of: ${allowed.join(", ")}`;
  return trimmed;
};

const ensureWorkOrder = async (id) => {
  const col = await workOrders();
  const doc = await col.findOne({
    _id: v.checkId(id, "workOrderId"),
  });
  if (!doc) throw "work order not found";
  return doc;
};

// verifies chargeCode exists in charges dataset
const ensureCharge = async (code, idx) => {
  const col = await charges();
  const doc = await col.findOne({
    _id: v.checkString(code, `items[${idx}].chargeCode`),
  });
  if (!doc) throw `items[${idx}].chargeCode not found in charges dataset`;
  return doc;
};

// validates item fields and default description and price from charge
const validateItem = async (item, idx) => {
  if (!item || typeof item !== "object" || Array.isArray(item))
    throw `items[${idx}] must be an object`;

  const chargeDoc = await ensureCharge(item.chargeCode, idx);

  const description =
    item.description !== undefined
      ? v.checkString(item.description, `items[${idx}].description`)
      : chargeDoc.description;

  const price =
    item.price !== undefined
      ? v.money(item.price, `items[${idx}].price`)
      : v.money(chargeDoc.avgCharge, `items[${idx}].price`);

  const quantity =
    item.quantity !== undefined
      ? v.positiveInteger(item.quantity, `items[${idx}].quantity`)
      : 1;

  const lineTotal = v.money(price * quantity, `items[${idx}].lineTotal`);

  return {
    chargeCode: chargeDoc._id.toString(),
    description,
    price,
    quantity,
    lineTotal,
  };
};

// compute totals from validated items
const computeTotals = (items, taxRate) => {
  const subtotal = v.money(
    items.reduce((sum, i) => sum + i.lineTotal, 0),
    "subtotal",
  );
  const rate = v.money(taxRate, "taxRate");
  const tax = v.money(subtotal * rate, "tax");
  const total = v.money(subtotal + tax, "total");
  return { subtotal, taxRate: rate, tax, total };
};

exportedMethods.createInvoice = async (
  workOrderId,
  companyName,
  datasetWorkIds = [],
  items = [],
  taxRate = 0,
  status = "draft",
  issuedDate = null,
  paidDate = null,
) => {
  await ensureWorkOrder(workOrderId);

  if (!Array.isArray(datasetWorkIds)) throw "datasetWorkIds must be an array";
  const validatedIds = datasetWorkIds.map((id, i) =>
    v.checkString(id, `datasetWorkIds[${i}]`),
  );
  const validatedItems = await Promise.all(
    items.map((item, i) => validateItem(item, i)),
  );

  const totals = computeTotals(validatedItems, taxRate);

  const newInvoice = {
    workOrderId: v.checkId(workOrderId, "workOrderId"),
    companyName: v.checkString(companyName, "companyName"),
    datasetWorkIds: validatedIds,
    items: validatedItems,
    subtotal: totals.subtotal,
    taxRate: totals.taxRate,
    tax: totals.tax,
    total: totals.total,
    status: statusInvoice(status),
    issuedDate: v.checkDate(issuedDate, "issuedDate"),
    paidDate: v.checkDate(paidDate, "paidDate"),
    createdAt: new Date(),
  };

  const col = await invoices();
  const insertInfo = await col.insertOne(newInvoice);
  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw "could not create invoice";

  newInvoice._id = insertInfo.insertedId;
  return normalize(newInvoice);
};

exportedMethods.getInvoiceById = async (id) => {
  const objId = v.checkId(id);
  const col = await invoices();
  const doc = await col.findOne({ _id: objId });
  if (!doc) throw "invoice not found";
  return normalize(doc);
};

exportedMethods.getAllInvoices = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = statusInvoice(filters.status);
  if (filters.companyName)
    query.companyName = v.checkString(filters.companyName, "companyName");
  if (filters.workOrderId)
    query.workOrderId = v.checkId(filters.workOrderId, "workOrderId");

  const col = await invoices();
  const docs = await col.find(query).toArray();
  return docs.map(normalize);
};

// update invoice
// when items change, revalidate items and compute totals
exportedMethods.updateInvoice = async (id, updates) => {
  if (!updates || typeof updates !== "object")
    throw "updates must be an object";
  const objId = v.checkId(id);
  const col = await invoices();
  const existing = await col.findOne({ _id: objId });
  if (!existing) throw "invoice not found";

  const toSet = {};
  if (updates.companyName !== undefined)
    toSet.companyName = v.checkString(updates.companyName, "companyName");
  if (updates.datasetWorkIds !== undefined) {
    if (!Array.isArray(updates.datasetWorkIds))
      throw "datasetWorkIds must be an array";
    toSet.datasetWorkIds = updates.datasetWorkIds.map((id, i) =>
      v.checkString(id, `datasetWorkIds[${i}]`),
    );
  }
  if (updates.status !== undefined)
    toSet.status = statusInvoice(updates.status);
  if (updates.issuedDate !== undefined)
    toSet.issuedDate = v.checkDate(updates.issuedDate, "issuedDate");
  if (updates.paidDate !== undefined)
    toSet.paidDate = v.checkDate(updates.paidDate, "paidDate");

  let newItems = existing.items;
  let newTaxRate = existing.taxRate;

  if (updates.items !== undefined) {
    if (!Array.isArray(updates.items)) throw "items must be an array";
    newItems = await Promise.all(
      updates.items.map((item, i) => validateItem(item, i)),
    );
    toSet.items = newItems;
  }

  if (updates.taxRate !== undefined) {
    newTaxRate = v.money(updates.taxRate, "taxRate");
    toSet.taxRate = newTaxRate;
  }
  if (updates.items !== undefined || updates.taxRate !== undefined) {
    const totals = computeTotals(newItems, newTaxRate);
    toSet.subtotal = totals.subtotal;
    toSet.tax = totals.tax;
    toSet.total = totals.total;
  }

  if (Object.keys(toSet).length === 0) throw "no valid fields to update";

  const updateInfo = await col.updateOne({_id: objId}, {$set: toSet});
  if (updateInfo.matchedCount===0) throw 'invoice not found'; 

  const updatedDoc = await col.findOne({_id: objId});
  if (!updatedDoc) throw 'invoice not found';
  return normalize(updatedDoc);
};

exportedMethods.removeInvoice = async (id) => {
  const objId = v.checkId(id);
  const col = await invoices();

  const existing = await col.findOne({_id: objId});
  if (!existing) throw 'invoice not found';

  const delInv = await col.deleteOne({_id: objId});
  if (delInv.deletedCount === 0) throw 'invoice not found';
  return normalize(existing);
};

export default exportedMethods;
