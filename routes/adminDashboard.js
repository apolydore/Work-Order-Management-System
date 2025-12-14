import { Router } from "express";
import workOrdersData from "../data/workOrders.js";
import jobRequestsData from "../data/jobRequests.js";
import usersData from "../data/users.js";
import { authRequired, adminOnly } from "../middleware.js";
import {contactMessages} from '../config/mongoCollections.js';

const router = Router();

//helper function to convert to a date
const toYMD = (val) => {
  if (!val) return null;
  //is the value a date instance, if not convert to date, if it is leave alone
  const d = val instanceof Date? val: new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

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

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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
              contractorName: `${contractor.firstName} ${contractor.lastName}`
            };
          } catch (error) {
            return { ...wo, contractorName: "Unassigned" };
          }
        }),
      );

      const todayWorkOrders = workOrdersWithContractors.filter((wo) => {
        const startStr = toYMD(wo.startDate);
        const endStr = toYMD(wo.estimatedEndDate);
        return startStr === todayStr || endStr === todayStr; 
      });

      //this is for the emergency contact us alerts
      const messagesCol = await contactMessages();
      const emergencyMessages = await messagesCol.find({isEmergency:true}).sort({createdAt:-1}).limit(10).toArray();

      //this is for high priority pending job requests
      const highPriorityRequests = jobRequests.filter((jr) => (jr.priority || "").toLowerCase()==="high"); 

      //this is to build an alerts list for the dash
      const alerts =[];

      for (const msg of emergencyMessages){
        alerts.push({
          type:"emergency",
          label:"Emergency Contact",
          title: msg.name,
          detail: msg.message,
          createdAt: msg.createdAt,
        });
      }

      for (const jr of highPriorityRequests){
        alerts.push({
          type:"high",
          label: "High Priority Job Request",
          title: jr.companyName,
          detail: jr.category,
          href: `/job-requests/${jr._id}`
        });
      }

      //this is for the overdue work orders to also be put on the alerts list
      const overdueWorkOrders = workOrdersWithContractors.filter((wo) => {
        const end = wo.estimatedEndDate ? new Date(wo.estimatedEndDate):null;
        if (!end || Number.isNaN(end.getTime())) return false;

        const endStr = toYMD(end);
        if (!endStr) return false;

        const status = (wo.status || "").toLowerCase();
        const incomplete = status !== "completed";

        return endStr < todayStr && incomplete;
      });

      for (const wo of overdueWorkOrders){
        alerts.push({
          type:"overdue",
          label: "Overdue Work Order",
          title: wo.companyName,
          detail: `Due: ${toYMD(wo.estimatedEndDate)} | Status: ${wo.status}`,
          href: `/work-orders/${wo._id}`,
          createdAt: wo.estimatedEndDate
        });
      }

      //sorting the alerts to make the newer ones first
      alerts.sort((a,b) =>{
        const ad = a.createdAt? new Date(a.createdAt).getTime():0;
        const bd = b.createdAt? new Date(b.createdAt).getTime():0; 
        return bd-ad; 
      })

      res.render("adminDash", {
        title: "Admin Dashboard",
        layout: "adminLayout",
        user: req.session.user,
        statistics: {
          total: workOrders.length,
          completed: workOrders.filter((wo) => wo.status === "completed")
            .length,
          inProgress: workOrders.filter((wo) => wo.status === "in progress")
            .length,
          notStarted: workOrders.filter((wo) => wo.status === "not started")
            .length,
        },
        workOrders: workOrdersWithContractors,
        jobRequests,
        todayWorkOrders,
        alerts
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      res.status(500).render("error", {
        title: "Dashboard Error",
        layout: "adminLayout",
        error: "Unable to load dashboard at this time.",
      });
    }
  },
);

export default router;
