import { Router } from "express";
import workOrdersData from "../data/workOrders.js";
import usersData from "../data/users.js";
import { adminOnly } from "../middleware.js";

const router = Router();

router.get("/", (req, res) => {
  return res.redirect("/dashboard");
});
// allows admin to see all work orders, contractors only see their own
/*router.get("/", async (req, res) => {
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
});*/

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

    let contractorName = "Unassigned";
    if (workOrder.assignedContractorId) {
      try {
        const contractor = await usersData.getUserById(
          workOrder.assignedContractorId,
        );
        contractorName = `${contractor.firstName} ${contractor.lastName}`;
      } catch (e) {}
    }

    let contractors = [];
    if (req.session.user.role === "admin") {
      const allContractors = await usersData.getAllContractors();
      contractors = allContractors.map((c) => ({
        _id: c._id.toString(),
        name: `${c.firstName} ${c.lastName}`,
        skills: c.skills.join(", "),
        isAssigned: c._id.toString() === workOrder.assignedContractorId,
      }));
    }
    res.render("workOrders/view", {
      title: "Work Order Details",
      layout: "mainLayout",
      workOrder,
      contractorName,
      contractors,
      isAdmin: req.session.user.role === "admin",
      user: req.session.user,
    });
  } catch (e) {
    res.status(404).render("error", {
      title: "not found",
      error: "work order not found",
      layout: "mainLayout",
    });
  }
});

router.post("/:id/assign", adminOnly, async (req, res) => {
  try {
    const { contractorId } = req.body;
    console.log("Assign route hit, contractorId:", req.body.contractorId);

    if (!contractorId) {
      return res.status(400).render("error", {
        title: "Error",
        error: "Please select a contractor",
        layout: "mainLayout",
      });
    }

    const updated = await workOrdersData.updateWorkOrder(req.params.id, {
      assignedContractorId: contractorId,
    });
    console.log("Update result:", updated);
    return res.redirect("/admin/dashboard");
  } catch (e) {
    console.error("Assign error:", e);
    return res.status(400).render("error", {
      title: "Error",
      error: e.toString(),
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
