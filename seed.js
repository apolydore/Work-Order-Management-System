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
      {
        companyName: allCompanies[0].companyName,
        category: "plumbing",
        priority: "high",
        description: "Leak near restroom sink on 3rd floor",
        address: "5 Willow Street",
        city: "New York",
        state: "NY",
        zipCode: 10010,
      },
      {
        companyName:
          allCompanies[1]?.companyName || allCompanies[0].companyName,
        category: "electrical",
        priority: "medium",
        description: "Replace faulty wiring in office building",
        address: "123 Main Street",
        city: "Brooklyn",
        state: "NY",
        zipCode: 11201,
      },
      {
        companyName:
          allCompanies[2]?.companyName || allCompanies[0].companyName,
        category: "hvac",
        priority: "low",
        description: "Annual HVAC maintenance check",
        address: "456 Park Avenue",
        city: "Queens",
        state: "NY",
        zipCode: 11375,
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
        jobRequestId: jobRequests[0]._id,
        companyName: jobRequests[0].companyName,
        assignedContractorId: contractor1._id,
        address: jobRequests[0].address,
        city: jobRequests[0].city,
        state: jobRequests[0].state,
        zipCode: jobRequests[0].zipCode,
        latitude: 40.7128,
        longitude: -74.006,
        status: "in progress",
        priority: "high",
        description: jobRequests[0].description,
        startDate: new Date("2025-01-15"),
        estimatedEndDate: new Date("2025-01-20"),
        comments: [
          {
            _id: "cm_1",
            name: "Admin",
            comment: "Assigned to Mike Rodriguez - plumbing specialist",
          },
        ],
      },
      {
        jobRequestId: jobRequests[1]._id,
        companyName: jobRequests[1].companyName,
        assignedContractorId: contractor2._id,
        address: jobRequests[1].address,
        city: jobRequests[1].city,
        state: jobRequests[1].state,
        zipCode: jobRequests[1].zipCode,
        latitude: 40.6782,
        longitude: -73.9442,
        status: "not started",
        priority: "medium",
        description: jobRequests[1].description,
        startDate: new Date("2025-01-22"),
        estimatedEndDate: new Date("2025-01-28"),
        comments: [
          {
            _id: "cm_2",
            name: "Admin",
            comment: "Scheduled for next week - Jennifer Chen assigned",
          },
        ],
      },
    ];

    await workOrdersCol.insertMany(workOrdersData);
    console.log(`Created ${workOrdersData.length} work orders\n`);

    //seed invoice
    console.log("Creating sample invoice...");

    const invoicesCol = await collections.invoices();
    const workOrders = await workOrdersCol.find({}).toArray();

    const invoiceData = {
      workOrderId: workOrders[0]._id,
      companyName: workOrders[0].companyName,
      issuedDate: "2025-01-29",
      datasetWorkIds: ["HWO-101", "HWO-102"],
      items: [
        {
          chargeCode: "HWO-101",
          description: "Fix leak",
          price: 150.0,
        },
        {
          chargeCode: "HWO-102",
          description: "Replace pipes",
          price: 450.0,
        },
      ],
      subtotal: 600.0,
      tax: 52.5,
      total: 652.5,
    };

    await invoicesCol.insertOne(invoiceData);
    console.log("Created 1 invoice\n");

    console.log("Database seeding complete!");
    console.log("-----------------------------------");
    console.log("Summary:");
    console.log(`Users: 4 (1 admin, 3 contractors)`);
    console.log(`Companies: ${companiesCreated.length}`);
    console.log(`Charge Codes: ${chargesData.length}`);
    console.log(`Job Requests: ${jobRequestsData.length}`);
    console.log(`Work Orders: ${workOrdersData.length}`);
    console.log(`Invoices: 1`);
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
