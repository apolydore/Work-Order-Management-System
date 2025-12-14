import contactRoutes from "./contact.js";
import userAuthRoutes from "./userAuth.js";
import jobRequestsRoutes from "./jobRequests.js";
import adminDashboardRoutes from "./adminDashboard.js";
import dailyScheduleRoutes from "./dailySchedule.js";
import workOrdersRoutes from "./workOrders.js";

const constructorMethod = (app) => {
  //contact form routes
  app.use("/", contactRoutes);
  app.use("/", userAuthRoutes);
  app.use("/job-requests", jobRequestsRoutes);
  app.use("/work-orders", workOrdersRoutes);
  app.use("/", dailyScheduleRoutes);
  app.use("/", adminDashboardRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).json({ error: "not found" });
  });
};

export default constructorMethod;
