import { Router } from "express";
import jobRequestsData from "../data/jobRequests.js";
import workOrdersData from "../data/workOrders.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const jobRequests = await jobRequestsData.getAllJobRequests();
    return res.render("jobRequests/index", {
      title: "Job Requests",
      layout: "mainLayout",
      jobRequests,
    });
  } catch (e) {
    return res.status(500).render("errors", {
      title: "Error",
      error: e.toString(),
      layout: "mainLayout",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const jobRequest = await jobRequestsData.getJobRequestById(req.params.id);
    return res.render("jobRequests/view", {
      title: "job request details",
      layout: "mainLayout",
      jobRequest,
      isAdmin: req.session.user.role === "admin",
    });
  } catch (e) {
    return res.status(404).render("error", {
      title: "not found",
      error: "job request not found",
      layout: "mainLayout",
    });
  }
});

// admin only approve request and create work order
router.post("/:id/approve", async (req, res) => {
  try {
    if (req.session.user.role !== "admin") {
      return res.status(403).json({ error: "admin only" });
    }

    const jobRequest = await jobRequestsData.getJobRequestById(req.params.id);
    await jobRequestsData.updateJobRequest(req.params.id, {
      staus: "approved",
    });

    const workOrder = await workOrdersData.createWorkOrder(
      jobRequest._id,
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
    return res.status(400).render("error", {
      title: "error",
      error: e.toString(),
      layout: "mainLayout",
    });
  }
});

router.post("/:id/reject", async (req, res) => {
  try {
    if (req.session.user.role !== "admin") {
      return res.status(403).json({ error: "admin only" });
    }

    await jobRequestsData.updateJobRequest(req.params.id, {
      status: "rejected",
    });
    return res.redirect("/job-requests");
  } catch (e) {
    return res.status(400).render("error", {
      title: "error",
      error: e.toString(),
      layout: "mainLayout",
    });
  }
});

export default router;
