// redirects logged in users away from signup/login page
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    if (req.session.user.role === "admin") {
      return res.redirect("/admin/dashboard");
    }
    return res.redirect("/contractor/dashboard");
  }
  next();
};

// protect routes user must be logged in
const authRequired = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

// admin only
const adminOnly = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).render("error", {
      title: "forbidden",
      error: "you do not have permission to view this page",
      layout: "mainLayout",
    });
  }
  next();
};

// contractor only
const contractorOnly = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  if (req.session.user.role !== "contractor") {
    return res.status(403).render("error", {
      title: "forbidden",
      error: "this page is only for contractors",
      layout: "mainLayout",
    });
  }
  next();
};

export { isAuthenticated, authRequired, adminOnly, contractorOnly };
