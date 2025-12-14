import { Router } from "express";
import workOrdersData from "../data/workOrders.js";
import jobRequestsData from "../data/jobRequests.js";
import usersData from "../data/users.js";
import { authRequired, adminOnly } from "../middleware.js";

const router = Router();

router.get(
  ["/dashboard", "/admin/dashboard"],
  authRequired,
  adminOnly,
  async (req, res) => {
    try {
      const workOrders = await workOrdersData.getWorkOrders();
      const jobRequests = await jobRequestsData.getAllJobRequests({
        status: "pending",
      });

      const workOrdersWithContractors = await Promise.all(
        workOrders.map(async (wo) => {
          if (!wo.assignedContractorId) {
            return { ...wo, contractorName: "Unassigned" };
          }
          try {
            const contractor = await usersData.getUserById(
              wo.assignedContractorId,
            );
            return {
              ...wo,
              contractorName: `${contractor.firstName} ${contractor.lastName}`,
            };
          } catch (error) {
            return { ...wo, contractorName: "Unassigned" };
          }
        }),
      );

      res.render("adminDash", {
        title: "Admin Dashboard",
        layout: "mainLayout",
        user: req.session.user,
        statistics: {
          total: workOrders.length,
          completed: workOrders.filter((wo) => wo.status === "completed")
            .length,
          inProgress: workOrders.filter((wo) => wo.status === "inprogress")
            .length,
          notStarted: workOrders.filter((wo) => wo.status === "not started")
            .length,
        },
        workOrders: workOrdersWithContractors,
        jobRequests,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      res.status(500).render("error", {
        title: "Dashboard Error",
        layout: "mainLayout",
        error: "Unable to load dashboard at this time.",
      });
    }
  },
);

export default router;
