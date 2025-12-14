import { Router } from "express";
import workOrdersData from "../data/workOrders.js";
import usersData from "../data/users.js";
import { authRequired, adminOnly } from "../middleware.js";

const router = Router();

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const overlapsDate = (wo, dateStr) => {
  const start = formatDate(wo.startDate);
  const end = wo.estimatedEndDate ? formatDate(wo.estimatedEndDate) : start;
  return start <= dateStr && dateStr <= end;
};

router.get(
  "/admin/schedule",
  authRequired,
  adminOnly,

  async (req, res) => {
    try {
      const today = new Date();
      const currentMonday = getMonday(today);
      const weekOffset = parseInt(req.query.week) || 0;
      const targetMonday = addDays(currentMonday, weekOffset * 7);

      const weekDays = [];
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      for (let i = 0; i < 7; i++) {
        const date = addDays(targetMonday, i);
        weekDays.push({
          name: dayNames[i],
          date: formatDate(date),
          displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
          isToday: formatDate(date) === formatDate(today),
          workOrders: [],
        });
      }

      const allWorkOrders = await workOrdersData.getWorkOrders();

      for (const wo of allWorkOrders) {
        let contractorName = "Unassigned";
        if (wo.assignedContractorId) {
          try {
            const contractor = await usersData.getUserById(wo.assignedContractorId);
            contractorName = `${contractor.firstName} ${contractor.lastName}`;
          } catch (e) { }
        }

        const workOrder = {
          ...wo,
          _id: wo._id.toString(),
          contractorName,
        };

        for (const day of weekDays) {
          if (overlapsDate(wo, day.date)) {
            day.workOrders.push(workOrder);
          }
        }
      }

      const weekStart = targetMonday;
      const weekEnd = addDays(targetMonday, 6);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const weekRangeDisplay = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`

      return res.render("schedule/view", {
        title: "Weekly Schedule",
        layout: "adminLayout",
        user: req.session.user,
        weekDays,
        weekRangeDisplay,
        prevWeek: weekOffset - 1,
        nextWeek: weekOffset + 1,
        currentWeek: weekOffset === 0,
      });
    } catch (e) {
      return res.status(500).render("error", {
        title: "Error",
        error: "Could not load schedule",
        layout: "adminLayout",
      });
    }
  });

     export default router;
