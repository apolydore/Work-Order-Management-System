# Work-Order-Management-System
CS 546_WS Final Project
Team 8: Dylan McCavitt, Amelia Polydore, Catherine Quan-Shau, Kevin Wang

Description:
The Work Order Management System is a web application designed to make the creation, assignment, and tracking of work orders easier to handle. It allows the admin to assign contractors to specific job sites and to turn job requests into active work orders. From here, the system can then generate invoices (when the job is complete), monitor the progress of the job, and update those work orders. Overall, it is designed to connect contractors with jobs around the city in an organized manner.

**Setup:**
<ul>
  <li>npm install</li>
  <li>npm run seed</li>
  <li>npm start</li>
</ul>

The routes should then be able to run on http://localhost:3000 server. From here, you can scroll the landing page. There is a "getting started" button that will take you to a "Create Account" page, if you scroll down further, there is also a "contact us" form to submit a message to the admin. In the nav bar, there are two buttons on the right hand side, one for logging in and the other for submitting a job request. 

The button for submitting a job request will take you to the job request form, where you should be able to choose from a list of companies already seeded in our database. After you submit the form, that request should get sent to the admin dashboard. 

One of our core features was the admin dashboard, so to log in as admin, <strong>the username is admin@wrkly.com and the password is password123</strong>. This should direct you to the admin dashboard. On the right hand side there is navigation shaped as a pill-bar with icons, if you hover over each icon, it should tell you what each one is. In the top left corner, there is a "w" that if you click it, it will take you back to the landing page. On the admin dashboard, we have a section for notifications and alerts, we also have a section for the work orders, the job requests, the statistics about work orders, and a schedule. If you click on the icons on the navbar, it should take you to separate places for these features. Also on the navbar is an icon for invoices, where you can create an invoice, update one, and see the current drafts of invoices and the ones that are currently active. 

Lastly, if you log out of admin and you create an account, this will make you a regular contractor account. The contractor dashboard is not one of our main features so it is slightly unfinished, but if you make an account, it should take you directly to your contractor dashboard. If you go back to the home page and then you go to the login button again, you should be redirected to your dashboard again. Without an admin role, you should not be able to access the admin dashboard. 

github repo: https://github.com/apolydore/Work-Order-Management-System


