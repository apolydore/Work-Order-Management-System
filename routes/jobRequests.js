import { Router } from "express";
import jobRequestsData from "../data/jobRequests.js";
import workOrdersData from "../data/workOrders.js";
import companiesData from "../data/companies.js";

const router = Router();

router.get("/", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Forbidden: admins only");
  }
  return res.redirect("/dashboard");
});
/*router.get("/", async (req, res) => {
  //admin only route again
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Forbidden: admins only");
  }

  try {
    const jobRequests = await jobRequestsData.getAllJobRequests();
    return res.render("jobRequests/index", {
      title: "Job Requests",
      layout: "adminLayout",
      jobRequests,
    });
  } catch (e) {
    return res.status(500).render("jobRequests/index", {
      title: "Job Requests",
      error: e.toString(),
      jobRequests: [],
      layout: "adminLayout",
    });
  }
  });*/

//this is to show create form
router.get("/new", async (req, res) => {
  const companies = await companiesData.getActiveCompaniesForDropdown();
  return res.render("jobRequests", {
    title: "Create Job Request",
    layout: "jobRequestLayout",
    form: {},
    companies,
  });
});

//creating a job request
router.post("/", async (req, res) => {
  const {
    companyName,
    category,
    priority,
    description,
    address,
    city,
    state,
    zipCode,
    attachmentUrl, //this is an optional field
  } = req.body;

  //missing checks
  const missing = [];
  if (!companyName) missing.push("companyName");
  if (!category) missing.push("category");
  if (!priority) missing.push("priority");
  if (!description) missing.push("description");
  if (!address) missing.push("address");
  if (!city) missing.push("city");
  if (!state) missing.push("state");
  if (!zipCode) missing.push("zipCode");

  if (missing.length > 0) {
    return res.status(400).render("jobRequests", {
      title: "Create Job Request",
      layout: "jobRequestLayout",
      error: `Missing field(s): ${missing.join(", ")}`,
      form: req.body,
    });
  }

  if (attachmentUrl && attachmentUrl.trim()) {
    const trimmedUrl = attachmentUrl.trim();

    //simple validation for if it is a url
    if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      return res.status(400).render("jobRequests", {
        title: "Create Job Request",
        layout: "jobRequestLayout",
        error: "attachmentUrl must start with http:// or https://",
        form: req.body,
      });
    }
  }

  try {
    const newReq = await jobRequestsData.createJobRequest(
      companyName,
      category,
      priority,
      description,
      address,
      city,
      state,
      zipCode,
      attachmentUrl,
    );

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(400).render("jobRequests", {
      title: "Create Job Request",
      layout: "jobRequestLayout",
      error: e.toString(),
      form: req.body,
    });
  }
});

router.get("/:id", async (req, res) => {
  //admin only to block the route
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Forbidden: admins only");
  }

  try {
    const jobRequest = await jobRequestsData.getJobRequestById(req.params.id);
    //checks to see if they are logged in and they are admin to prevent any crashing of page
    const isAdmin = req.session.user && req.session.user.role === "admin";

    return res.render("jobRequests/view", {
      title: "job request details",
      layout: "mainLayout",
      jobRequest,
      isAdmin,
      isPending: jobRequest.status === "pending",
    });
  } catch (e) {
    return res.redirect("/job-requests");
  }
});

// admin only approve request and create work order
router.post("/:id/approve", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Forbidden: admins only");
  }
  console.log("Approve route hit, id:", req.params.id);
  try {
    const jobRequest = await jobRequestsData.getJobRequestById(req.params.id);
    await jobRequestsData.updateJobRequest(req.params.id, {
      status: "approved",
    });

    const workOrder = await workOrdersData.createWorkOrder(
      req.params.id,
      jobRequest.companyName,
      null,
      jobRequest.priority,
      jobRequest.description,
      jobRequest.address,
      jobRequest.city,
      jobRequest.state,
      jobRequest.zipCode,
      null,
      null,
      "not started",
      new Date(),
      null,
      [],
    );

    return res.redirect(`/work-orders/${workOrder._id}`);
  } catch (e) {
    console.error("Approve error:", e);
    return res.redirect(`/job-requests/${req.params.id}`);
  }
});

router.post("/:id/reject", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Forbidden: admins only");
  }

  try {
    await jobRequestsData.updateJobRequest(req.params.id, {
      status: "rejected",
    });
    return res.redirect("/admin/dashboard");
  } catch (e) {
    return res.redirect(`/job-requests/${req.params.id}`);
  }
});

export default router;
