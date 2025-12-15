// To render handlebar views
import { Router } from "express";
import { contactMessages } from "../config/mongoCollections.js";
import { workOrders } from "../config/mongoCollections.js";
import  workOrdersData  from "../data/workOrders.js";
const router = Router();


// Dashboard page
router.get("/dashboard", async (req, res) => {
  if (req.session?.user?.role === "admin") {
    return res.redirect("/admin/dashboard");
  }

  try {
    const messagesCol = await contactMessages();
    const workOrdersCol = await workOrders();
    const currentDate = new Date();
    const user = req.session?.user;
    const isContractor = user?.role === "contractor";

    // if contractor, get assigned work workOrders
    let assignedWorkOrders = [];
    if (isContractor && user._id) {
      assignedWorkOrders = await workOrdersData.getWorkOrders({
        contractorId: user._id,
      });
    }

    // Statistics
    let completed, inProgress, notStarted, total;
    if (isContractor && user._id) {
      completed = assignedWorkOrders.filter((wo) => wo.status === "completed").length;
      inProgress = assignedWorkOrders.filter((wo) => wo.status === "in progress").length;
      notStarted = assignedWorkOrders.filter((wo) => wo.status === "not started").length;
      total = assignedWorkOrders.length;
    } else {
      const completed = await workOrdersCol.countDocuments({
        status: "completed",
      });
      const inProgress = await workOrdersCol.countDocuments({
        status: "in progress",
      });
      const notStarted = await workOrdersCol.countDocuments({
        status: "not started",
      });
      const total = await workOrdersCol.countDocuments({});
    }
    // Get emergency alerts (3 alerts max for the dashboard)
    const alerts = await messagesCol
      .find({ isEmergency: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    // Get overdue jobs (3 max)
    let findOverDue = {
      status: "in progress",
      estimatedEndDate: { $lt: currentDate },
    };
    if (isContractor && user._id) {
      const { ObjectId } = await import("mongodb");
      findOverDue.assignedContractorId = new ObjectId(user._id);
    }
    const overDueJobs = await workOrdersCol.find(findOverDue).sort({ estimatedEndDate: 1 }).limit(3).toArray();

    res.render("dashboard", {
      title: "Dashboard",
      layout: "mainLayout",
      user: user || { firstName: "User", lastName: "" },
      isContractor,
      statistics: {
        total,
        completed,
        inProgress,
        notStarted,
      },
      alerts,
      overDueJobs,
      assignedWorkOrders
    });
  } catch (e) {
    console.e("Error loading dashboard:", error);
    res.status(500).send("Error loading dashboard");
  }
});

// Notifications page
router.get("/notifications", async (req, res) => {
  try {
    const messagesCol = await contactMessages();
    const workOrdersCol = await workOrders();
    const currentDate = new Date();

    // Get all emergency alerts
    const alerts = await messagesCol
      .find({ isEmergency: true })
      .sort({ createdAt: -1 })
      .toArray();

    // Get all overdue jobs
    const overdueJobs = await workOrdersCol
      .find({
        status: "in progress",
        estimatedEndDate: { $lt: currentDate },
      })
      .sort({ estimatedEndDate: 1 })
      .toArray();

    res.render("notifications", {
      title: "Notifications",
      layout: "mainLayout",
      user: req.session?.user || { firstName: "User", lastName: "" },
      alerts,
      overdueJobs,
    });
  } catch (error) {
    console.error("Error loading notifications:", error);
    res.status(500).send("Error loading notifications");
  }
});

// Statistics page
router.get("/statistics", async (req, res) => {
  try {
    const workOrdersCol = await workOrders();

    // Get statistics
    const completed = await workOrdersCol.countDocuments({
      status: "completed",
    });
    const inProgress = await workOrdersCol.countDocuments({
      status: "in progress",
    });
    const notStarted = await workOrdersCol.countDocuments({
      status: "not started",
    });
    const total = await workOrdersCol.countDocuments({});

    // Calculate percentages
    const completedPercentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    const inProgressPercentage =
      total > 0 ? Math.round((inProgress / total) * 100) : 0;
    const notStartedPercentage =
      total > 0 ? Math.round((notStarted / total) * 100) : 0;

    res.render("statistics", {
      title: "Statistics",
      layout: "mainLayout",
      user: req.session?.user || { firstName: "User", lastName: "" },
      statistics: {
        total,
        completed,
        inProgress,
        notStarted,
      },
      completedPercentage,
      inProgressPercentage,
      notStartedPercentage,
    });
  } catch (error) {
    console.error("Error loading statistics:", error);
    res.status(500).send("Error loading statistics");
  }
});

export default router;
