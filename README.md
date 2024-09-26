# Express Application

## Prerequisites

1. **Install Node.js and npm**  
   Ensure you have Node.js and npm installed.

2. **Set Up Environment Variables**  
   Create a `.env` file in the root directory of your project and set up the following variables:
DB_NAME=<Your Database Name>
DB_USER=<Your Database Username>
DB_PASSWORD=<Your Database Password>
DB_HOST=<Your Database Host, e.g., localhost>
DB_PORT=<Your Database Port, e.g., 5432 for PostgreSQL>
DB_DIALECT=<Your Database Dialect, e.g., postgres, mysql>
PORT=<Port for your application to run, e.g., 3000>



## Build and Deploy Instructions

1. **Clone the Repository**  
Clone the repository to your local machine using the following command:

`git clone <repository-url>`

2. **Install Dependencies**  
Install the required Node.js packages using npm:

`npm install`

3. **Start your MySQL Instance**  
Make sure your MySQL database instance is running and accessible.

4. **Run the Application**  
Start the application using the following command:

`npm start`

5. **Verify the Health Check Endpoint**  
To verify that the application is running correctly and can connect to the database, open your browser or use a tool like Postman to make a GET request to:

`http://localhost:<PORT>/healthz`

If everything is set up correctly, you should receive a `200 OK` status. If there's an issue with the database connection, you'll receive a `503` status.
