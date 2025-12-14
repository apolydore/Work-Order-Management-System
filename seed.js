import { dbConnection, closeConnection } from "./config/mongoConnection.js";
import * as collections from "./config/mongoCollections.js";
import usersData from "./data/users.js";
import userAuthData from "./data/userAuth.js";
import companiesData from "./data/companies.js";
import fs from "fs";
import { parse } from "csv-parse/sync";

const seedDatabase = async () => {
  const db = await dbConnection();

  console.log("Starting database seed...\n");

  // date helper so the seed data is always relative to today
  const today = new Date();
  const addDays = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };

  try {
    //clear existing collections
    console.log("Clearing collections...");
    await db.collection("users").deleteMany({});
    await db.collection("userAuth").deleteMany({});
    await db.collection("companies").deleteMany({});
    await db.collection("jobRequests").deleteMany({});
    await db.collection("workOrders").deleteMany({});
    await db.collection("invoices").deleteMany({});
    await db.collection("charges").deleteMany({});
    console.log("Collections cleared\n");

    //seed users
    console.log("Creating users...");

    //admin
    const admin = await usersData.createUser(
      "admin",
      "Sarah",
      "Johnson",
      "New York",
      "NY",
      "212-555-0100",
      ["management", "oversight"],
    );
    console.log(`Created admin: ${admin.firstName} ${admin.lastName}`);

    await userAuthData.createAuthRecord(
      admin._id.toString(),
      "admin@wrkly.com",
      "password123",
    );

    //contractors
    const contractor1 = await usersData.createUser(
      "contractor",
      "Mike",
      "Rodriguez",
      "Brooklyn",
      "NY",
      "718-555-0201",
      ["plumbing", "electrical", "hvac"],
    );
    console.log(
      `Created contractor: ${contractor1.firstName} ${contractor1.lastName}`,
    );

    await userAuthData.createAuthRecord(
      contractor1._id.toString(),
      "mike@contractor.com",
      "password123",
    );

    const contractor2 = await usersData.createUser(
      "contractor",
      "Jennifer",
      "Chen",
      "Queens",
      "NY",
      "347-555-0302",
      ["electrical", "carpentry"],
    );
    console.log(
      `Created contractor: ${contractor2.firstName} ${contractor2.lastName}`,
    );

    await userAuthData.createAuthRecord(
      contractor2._id.toString(),
      "jennifer@contractor.com",
      "password123",
    );

    const contractor3 = await usersData.createUser(
      "contractor",
      "David",
      "Williams",
      "Bronx",
      "NY",
      "929-555-0403",
      ["plumbing", "welding"],
    );
    console.log(
      `Created contractor: ${contractor3.firstName} ${contractor3.lastName}`,
    );

    await userAuthData.createAuthRecord(
      contractor3._id.toString(),
      "david@contractor.com",
      "password123",
    );

    console.log("Users created\n");

    //seed companies from csv
    console.log("Loading companies from CSV...");

    const csvContent = fs.readFileSync(
      "./Directory_Of_Awarded_Construction_Contracts_20251207.csv",
      "utf-8",
    );
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const companiesCreated = [];

    for (const record of records) {
      try {
        const companyName = record["SELECTED FIRM"].trim();

        if (!companyName || companiesCreated.includes(companyName)) {
          continue;
        }

        const company = await companiesData.createCompany(
          companyName,
          `www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
          `${Math.floor(Math.random() * 9999) + 1} Construction Ave`,
          ["New York", "Brooklyn", "Queens", "Bronx"][
          Math.floor(Math.random() * 4)
          ],
          "NY",
          10001 + Math.floor(Math.random() * 200),
          {
            name: "John Doe",
            email: `contact@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
            phone: `${Math.floor(Math.random() * 900) + 100}-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
            title: "Project Manager",
          },
          true,
        );

        companiesCreated.push(companyName);
        console.log(`Created company: ${companyName}`);
      } catch (e) {
        if (!e.toString().includes("already exists")) {
          console.log(`Warning: ${e}`);
        }
      }
    }
    console.log(`Created ${companiesCreated.length} companies\n`);

    //seed charges for invoicing
    console.log("Creating charge codes...");

    const chargesCol = await collections.charges();
    const chargesData = [
      {
        _id: "HWO-101",
        category: "plumbing",
        description: "Fix leak",
        avgCharge: 150.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        _id: "HWO-102",
        category: "plumbing",
        description: "Replace pipes",
        avgCharge: 450.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        _id: "HWO-201",
        category: "electrical",
        description: "Repair wiring",
        avgCharge: 200.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        _id: "HWO-202",
        category: "electrical",
        description: "Install fixtures",
        avgCharge: 175.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        _id: "HWO-301",
        category: "hvac",
        description: "AC repair",
        avgCharge: 300.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        _id: "HWO-302",
        category: "hvac",
        description: "Heating system maintenance",
        avgCharge: 250.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        _id: "HWO-401",
        category: "carpentry",
        description: "Door repair",
        avgCharge: 125.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        _id: "HWO-402",
        category: "carpentry",
        description: "Window installation",
        avgCharge: 350.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        _id: "HWO-501",
        category: "welding",
        description: "Metal fabrication",
        avgCharge: 400.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        _id: "HWO-502",
        category: "welding",
        description: "Structural welding",
        avgCharge: 500.0,
        lastUpdated: new Date().toISOString(),
      },
    ];

    await chargesCol.insertMany(chargesData);
    console.log(`Created ${chargesData.length} charge codes\n`);

    // seed job requests
    console.log("Creating job requests...");

    const jobRequestsCol = await collections.jobRequests();
    const allCompanies = await companiesData.getAllCompanies();

    const jobRequestsData = [
      // pending requests
      {
         companyName: allCompanies[0]?.companyName ?? allCompanies[0].companyName,
         category: "plumbing",
         priority: "high",
         description: "Urgent pipe burst in basement - flooding risk",
         address: "5 Willow Street",
         city: "New York",
         state: "NY",
         zipCode: 10010,
         status: "pending",
       },
       {
         companyName: allCompanies[1]?.companyName ?? allCompanies[0].companyName,
         category: "electrical",
         priority: "high",
         description: "Power outage in east wing - safety hazard",
         address: "789 Broadway",
         city: "Manhattan",
         state: "NY",
         zipCode: 10003,
         status: "pending",
       },
       {
         companyName: allCompanies[2]?.companyName ?? allCompanies[0].companyName,
         category: "hvac",
         priority: "medium",
         description: "AC unit making loud noise, needs inspection",
         address: "456 Park Avenue",
         city: "Queens",
         state: "NY",
         zipCode: 11375,
         status: "pending",
       },
       {
         companyName: allCompanies[3]?.companyName ?? allCompanies[0].companyName,
         category: "carpentry",
         priority: "low",
         description: "Replace damaged door frame in lobby",
         address: "222 Oak Street",
         city: "Brooklyn",
         state: "NY",
         zipCode: 11201,
         status: "pending",
       },
       // Approved requests already converted to work orders
       {
         companyName: allCompanies[4]?.companyName ?? allCompanies[0].companyName,
         category: "plumbing",
         priority: "high",
         description: "Leak near restroom sink on 3rd floor",
         address: "123 Main Street",
         city: "Brooklyn",
         state: "NY",
         zipCode: 11202,
         status: "approved",
       },
       {
         companyName: allCompanies[5]?.companyName ?? allCompanies[0].companyName,
         category: "electrical",
         priority: "medium",
         description: "Replace faulty wiring in office building",
         address: "500 Commerce Drive",
         city: "Bronx",
         state: "NY",
         zipCode: 10451,
         status: "approved",
       },
       {
         companyName: allCompanies[6]?.companyName ?? allCompanies[0].companyName,
         category: "welding",
         priority: "medium",
         description: "Repair metal staircase railing",
         address: "88 Industrial Way",
         city: "Queens",
         state: "NY",
         zipCode: 11101,
         status: "approved",
       },
       {
         companyName: allCompanies[7]?.companyName ?? allCompanies[0].companyName,
         category: "hvac",
         priority: "low",
         description: "Annual HVAC maintenance check",
         address: "333 Tower Place",
         city: "Manhattan",
         state: "NY",
         zipCode: 10016,
         status: "approved",
       },
       {
         companyName: allCompanies[8]?.companyName ?? allCompanies[0].companyName,
         category: "carpentry",
         priority: "high",
         description: "Emergency window replacement - broken glass",
         address: "45 Maple Avenue",
         city: "Brooklyn",
         state: "NY",
         zipCode: 11215,
         status: "approved",
       },
       {
         companyName: allCompanies[9]?.companyName ?? allCompanies[0].companyName,
         category: "plumbing",
         priority: "medium",
         description: "Install new water heater",
         address: "900 River Road",
         city: "Bronx",
         state: "NY",
         zipCode: 10463,
         status: "approved",
       },
     ];

    await jobRequestsCol.insertMany(jobRequestsData);
    console.log(`Created ${jobRequestsData.length} job requests\n`);

    //seed work orders
    console.log("Creating work orders...");

    const workOrdersCol = await collections.workOrders();
    const jobRequests = await jobRequestsCol.find({}).toArray();

    const workOrdersData = [
      {
        jobRequestId: jobRequests[4]._id,
        companyName: jobRequests[4].companyName,
        assignedContractorId: contractor1._id, // Mike
        address: jobRequests[4].address,
        city: jobRequests[4].city,
        state: jobRequests[4].state,
        zipCode: jobRequests[4].zipCode,
        latitude: 40.6782,
        longitude: -73.9442,
        status: "in progress",
        priority: "high",
        description: jobRequests[4].description,
        startDate: addDays(-3),
        estimatedEndDate: addDays(2),
        comments: [
          { _id: "cm_1", name: "Admin", comment: "Assigned to Mike Rodriguez - plumbing specialist" },
          { _id: "cm_1b", name: "Mike Rodriguez", comment: "On site, assessing damage. Replacement parts needed." },
        ],
      },
      {
        jobRequestId: jobRequests[5]._id,
        companyName: jobRequests[5].companyName,
        assignedContractorId: contractor2._id, // Jennifer
        address: jobRequests[5].address,
        city: jobRequests[5].city,
        state: jobRequests[5].state,
        zipCode: jobRequests[5].zipCode,
        latitude: 40.8448,
        longitude: -73.8648,
        status: "not started",
        priority: "medium",
        description: jobRequests[5].description,
        startDate: addDays(1),
        estimatedEndDate: addDays(5),
        comments: [
          { _id: "cm_2", name: "Admin", comment: "Scheduled for tomorrow - Jennifer Chen assigned" },
        ],
      },
      {
        jobRequestId: jobRequests[6]._id,
        companyName: jobRequests[6].companyName,
        assignedContractorId: contractor3._id, // David
        address: jobRequests[6].address,
        city: jobRequests[6].city,
        state: jobRequests[6].state,
        zipCode: jobRequests[6].zipCode,
        latitude: 40.7282,
        longitude: -73.7949,
        status: "completed",
        priority: "medium",
        description: jobRequests[6].description,
        startDate: addDays(-14),
        estimatedEndDate: addDays(-7),
        comments: [
          { _id: "cm_3", name: "Admin", comment: "Assigned to David Williams - welding specialist" },
          { _id: "cm_3b", name: "David Williams", comment: "Railing repaired and up to code." },
        ],
      },
      {
        jobRequestId: jobRequests[7]._id,
        companyName: jobRequests[7].companyName,
        assignedContractorId: contractor1._id, // Mike
        address: jobRequests[7].address,
        city: jobRequests[7].city,
        state: jobRequests[7].state,
        zipCode: jobRequests[7].zipCode,
        latitude: 40.7484,
        longitude: -73.9857,
        status: "in progress",
        priority: "low",
        description: jobRequests[7].description,
        startDate: addDays(-10),
        estimatedEndDate: addDays(-3),
        comments: [
          { _id: "cm_4", name: "Admin", comment: "Routine maintenance, Mike assigned" },
          { _id: "cm_4b", name: "Mike Rodriguez", comment: "Delayed waiting on parts delivery." },
        ],
      },
      {
        jobRequestId: jobRequests[8]._id,
        companyName: jobRequests[8].companyName,
        assignedContractorId: contractor2._id, // Jennifer
        address: jobRequests[8].address,
        city: jobRequests[8].city,
        state: jobRequests[8].state,
        zipCode: jobRequests[8].zipCode,
        latitude: 40.6732,
        longitude: -73.9772,
        status: "not started",
        priority: "high",
        description: jobRequests[8].description,
        startDate: addDays(5),
        estimatedEndDate: addDays(7),
        comments: [
          { _id: "cm_5", name: "Admin", comment: "Emergency job scheduled - Jennifer Chen assigned" },
        ],
      },
      {
        jobRequestId: jobRequests[9]._id,
        companyName: jobRequests[9].companyName,
        assignedContractorId: contractor3._id, // David
        address: jobRequests[9].address,
        city: jobRequests[9].city,
        state: jobRequests[9].state,
        zipCode: jobRequests[9].zipCode,
        latitude: 40.8851,
        longitude: -73.9097,
        status: "completed",
        priority: "medium",
        description: jobRequests[9].description,
        startDate: addDays(-20),
        estimatedEndDate: addDays(-14),
        comments: [
          { _id: "cm_6", name: "Admin", comment: "Assigned to David Williams" },
          { _id: "cm_6b", name: "David Williams", comment: "Water heater installed and tested. Customer satisfied." },
        ],
      },
    ];

    await workOrdersCol.insertMany(workOrdersData);
    console.log(`Created ${workOrdersData.length} work orders\n`);

    //seed invoice
    console.log("Creating sample invoice...");

    const invoicesCol = await collections.invoices();
    const workOrders = await workOrdersCol.find({}).toArray();

    const invoicesData = [
      {
        workOrderId: workOrders[2]._id, // Completed welding job
        companyName: workOrders[2].companyName,
        issuedDate: addDays(-5),
        datasetWorkIds: ["HWO-501", "HWO-502"],
        items: [
          { chargeCode: "HWO-501", description: "Metal fabrication", price: 400.0 },
          { chargeCode: "HWO-502", description: "Structural welding", price: 500.0 },
        ],
        subtotal: 900.0,
        tax: 78.75,
        total: 978.75,
      },
      {
        workOrderId: workOrders[5]._id, // Completed plumbing job
        companyName: workOrders[5].companyName,
        issuedDate: addDays(-12),
        datasetWorkIds: ["HWO-101", "HWO-102"],
        items: [
          { chargeCode: "HWO-101", description: "Fix leak", price: 150.0 },
          { chargeCode: "HWO-102", description: "Replace pipes", price: 450.0 },
        ],
        subtotal: 600.0,
        tax: 52.5,
        total: 652.5,
      },
    ];
    await invoicesCol.insertMany(invoicesData);
    console.log(`Created ${invoicesData.length} invoices\n`);

    console.log("Database seeding complete!");
    console.log("-----------------------------------");
    console.log("Summary:");
    console.log(`Users: 4 (1 admin, 3 contractors)`);
    console.log(`Companies: ${companiesCreated.length}`);
    console.log(`Charge Codes: ${chargesData.length}`);
    console.log(`Job Requests: ${jobRequestsData.length} (4 pending, 6 approved)`);
    console.log(`Work Orders: ${workOrdersData.length} (2 completed, 2 in progress, 2 not started)`);
    console.log(`Invoices: ${invoicesData.length}`);
    console.log("-----------------------------------");
    console.log("Login credentials:");
    console.log("Admin: admin@wrkly.com / password123");
    console.log("Contractor: mike@contractor.com / password123");
    console.log("Contractor: jennifer@contractor.com / password123");
    console.log("Contractor: david@contractor.com / password123");
    console.log("-----------------------------------\n");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await closeConnection();
    console.log("Database connection closed");
  }
};

seedDatabase()
  .then(() => {
    console.log("Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
