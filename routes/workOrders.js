import { Router } from "express";
import workOrdersData from "../data/workOrders.js";

const router = Router();

// allows admin to see all work orders, contractors only see their own
router.get("/", async (req, res) => {
  try {
    const filters =
      req.session.user.role === "admin"
        ? {}
        : {
            contractorId: req.session.user._id,
          };
    const workOrders = await workOrdersData.getWorkOrders(filters);

    return res.render("workOrders/index", {
      title: "Work Orders",
      layout: "mainLayout",
      workOrders,
    });
  } catch (e) {
    return res.status(500).render("error", {
      title: "Error",
      error: e.toString(),
      layout: "mainLayout",
    });
  }
});

// blocks contractors from viewing others work orders
router.get("/:id", async (req, res) => {
  try {
    const workOrder = await workOrdersData.getWorkOrderById(req.params.id);
    if (
      req.session.user.role === "contractor" &&
      workOrder.assignedContractorId !== req.session.user._id
    ) {
      return res.status(403).render("error", {
        title: "forbidden",
        error: "you are not assigned to this work order",
        layout: "mainLayout",
      });
    }
    res.render("workorderDetails", {
      title: "Work Order Details",
      layout: "mainLayout",
      workOrder,
    });
  } catch (e) {
    res.status(404).render("error", {
      title: "not found",
      error: "work order not found",
      layout: "mainLayout",
    });
  }
});

// add comment or update status
router.post("/:id/comment", async (req, res) => {
  try {
    if (!req.body.comment || !req.body.comment.trim()) {
      return res.status(400).json({ error: "comment cannot be empty" });
    }
    await workOrdersData.addComment(req.params.id, {
      name: `${req.session.user.firstName} ${req.session.user.lastName}`,
      comment: req.body.comment.trim(),
    });
    return res.redirect(`/work-orders/${req.params.id}`);
  } catch (e) {
    return res.status(400).json({ error: e.toString() });
  }
});

router.post("/:id/status", async (req, res) => {
  try {
    await workOrdersData.updateWorkOrder(req.params.id, {
      status: req.body.status,
    });
    return res.redirect(`/work-orders/${req.params.id}`);
  } catch (e) {
    return res.status(400).json({ error: e.toString() });
  }
});

export default router;
