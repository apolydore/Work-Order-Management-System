import {Router} from "express";
import invoicesData from "../data/invoices.js";
import workOrdersData from "../data/workOrders.js";
import {charges} from "../config/mongoCollections.js";
import {adminOnly} from "../middleware.js";

const router = Router();

//helper to force is into an array instead of a single string
const asArray = (val) => {
    if (val === undefined || val === null) return [];
    return Array.isArray(val)? val:[val];
};

//get the invoices
router.get("/", adminOnly, async (req, res) => {
    try{
        const invoices = await invoicesData.getAllInvoices();
        return res.render("invoices/index", {
            title: "Invoices",
            layout: "adminLayout",
            invoices,
            user: req.session.user
        });
    } catch (e){
        return res.status(500).render("error", {
            title: "Error",
            layout: "adminLayout",
            error: e.toString()
        });
    }
});

//get new invoice
router.get("/new", adminOnly, async (req, res) => {
    try{
        const workOrders = await workOrdersData.getWorkOrders();
        const chargesCol = await charges();
        const chargeList = await chargesCol.find({}).sort({_id:1}).toArray();

        return res.render("invoices/new", {
            title: "Create Invoice",
            layout: "adminLayout",
            user: req.session.user,
            workOrders,
            chargeList,
            form: {}
        });
    } catch (e){
        return res.status(500).render("error", {
            title: "Error",
            layout: "adminLayout",
            error: e.toString()
        });
    }
});

//create or post invoices
router.post("/", adminOnly, async (req, res) => {
    try{
        const {workOrderId, taxRate} = req.body;

        //the dataset work ids can come in as comma separated, or they can be repeated
        const rawDatasetIds = req.body.datasetWorkIds || "";
        const datasetWorkIds = rawDatasetIds.split(",").map((s) => s.trim()).filter((s) => s.length>0);

        const chargeCodes = asArray(req.body.chargeCode);
        const descriptions = asArray(req.body.description);
        const quantities = asArray(req.body.quantities);
        const prices = asArray(req.body.price);

        const items = chargeCodes.map((code,i) => {
            const obj = {chargeCode: code};

            if (quantities[i] !== undefined && prices[i] !== null && `${prices[i]}`.trim() !== ""){
                obj.quantity = Number(quantities[i]);
            }
            if (prices[i] !== undefined && prices[i] !== null && `${prices[i]}`.trim() !== ""){
                obj.price = Number(prices[i]);
            }

            return obj; 
        }).filter((it) => it.chargeCode && `${it.chargeCode}`.trim().length>0); //this is to remove blank rows

        const wo = await workOrdersData.getWorkOrderById(workOrderId);

        const created = await invoicesData.createInvoice(
            workOrderId,
            wo.companyName,
            datasetWorkIds,
            items,
            taxRate !== undefined && taxRate !== null && `${taxRate}`.trim() !== ""? Number(taxRate): 0,
            "draft",
            null,
            null
        );

        return res.redirect(`/invoices/${created._id}`);
    } catch (e){
        try{
            const workOrders = await workOrdersData.getWorkOrders();
            const chargesCol = await charges();
            const chargeList = await chargesCol.find({}).sort({_id:1}).toArray();

            return res.status(400).render("invoices/new", {
                title: "Create Invoice",
                layout: "adminLayout",
                user: req.session.user,
                workOrders,
                chargeList,
                error: e.toString(),
                form: req.body,
            });
        } catch (innerErr){
            return res.status(400).render("error", {
                title: "Error",
                layout: "adminLayout",
                error: e.toString()
            });
        }
    }
});

//to get invoices by id
router.get("/:id", adminOnly, async (req, res) => {
    try{
        const invoice = await invoicesData.getInvoiceById(req.params.id);

        return res.render("invoices/view", {
            title: "Invoice Details",
            layout: "adminLayout",
            user: req.session.user,
            invoice
        });
    } catch (e){
        return res.status(404).render("error", {
            title: "Not Found",
            layout: "adminLayout",
            error: e.toString()
        });
    }
});

//this is to update the status
router.post("/:id/status", adminOnly, async (req, res) => {
    try{
        const {status}=req.body;
        await invoicesData.updateInvoice(req.params.id, {status});
        return res.redirect(`/invoices/${req.params.id}`);
    } catch (e){
        return res.status(400).render("error", {
            title: "Error",
            layout: "adminLayout",
            error: e.toString()
        });
    }
});

router.post("/:id/delete", adminOnly, async (req, res) => {
    try {
        await invoicesData.removeInvoice(req.params.id);
        return res.redirect("/invoices");
    } catch (e){
        return res.status(400).render("error", {
            title: "Error",
            layout: "adminLayout",
            error: e.toString()
        });
    }
});

export default router;