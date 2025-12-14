import { Router } from "express";
import workOrdersData from "../data/workOrders.js";
import usersData from "../data/users.js";
import { authRequired, adminOnly } from "../middleware.js";

const router = Router();

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// helper function to compare dates
const compareDates = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};

router.get(
  "/admin/schedule",
  authRequired,
  adminOnly,

  async (req, res) => {
    try {
      const today = getTodayDate();
      const allWorkOrders = await workOrdersData.getWorkOrders();

      const startingToday = [];
      const inProgress = [];
      const dueToday = [];
      const overdue = [];

      for (const wo of allWorkOrders) {
        let contractorName = "Unassigned";
        try {
          const contractor = await usersData.getUserById(
            wo.assignedContractorId.toString(),
          );
          contractorName = `${contractor.firstName} ${contractor.lastName}`;
        } catch (e) {
          // keep as unassigned
        }

        const workOrder = {
          ...wo,
          _id: wo._id.toString(),
          contractorName,
        };

        // check if starting today
        if (wo.startDate === today) {
          startingToday.push(workOrder);
        }

        // check if in progress (between start and end, but not starting or ending today)
        const afterStart = compareDates(today, wo.startDate) > 0;
        const beforeEnd = compareDates(today, wo.estimatedEndDate) < 0;
        if (afterStart && beforeEnd) {
          inProgress.push(workOrder);
        }

        // check if due today
        if (wo.estimatedEndDate === today) {
          dueToday.push(workOrder);
        }

        // check if overdue
        const pastDue = compareDates(today, wo.estimatedEndDate) > 0;
        if (pastDue && wo.status !== "completed") {
          overdue.push(workOrder);
        }
      }

      return res.render("dailySchedule", {
        title: "Daily Schedule",
        user: req.session.user,
        today,
        startingToday,
        inProgress,
        dueToday,
        overdue,
        layout: "mainLayout",
      });
    } catch (e) {
      console.error("Error loading daily schedule:", e);
      return res.status(500).render("error", {
        title: "Error",
        error: "Could not load schedule",
        layout: "mainLayout",
      });
    }
  },
);

export default router;
