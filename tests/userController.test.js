const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes'); 
const sequelize = require('../config/database'); 

const app = express();
app.use(express.json());
app.use(userRoutes);

describe('User Routes Tests', () => {
  
  // Run this before all the tests to sync models and create tables
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // Drops tables and recreates them
  });

  // Cleanup after all tests
  afterAll(async () => {
    await sequelize.close(); // Close the DB connection
  });

  test('should register a new user', async () => {
    const response = await request(app)
      .post('/v1/user')
      .send({
        email: 'register@example.com',
        firstName: 'Register',
        lastName: 'User',
        password: 'securepassword'
      });
      
    expect(response.status).toBe(201); // Should be 201 for created
    expect(response.body).toHaveProperty('id'); // Check if an ID is returned
    expect(response.body.email).toBe('register@example.com'); // Email should match
  });

  test('should not register a user with existing email', async () => {
    // First registration with this email
    await request(app)
      .post('/v1/user')
      .send({
        email: 'duplicate@example.com',
        firstName: 'Duplicate',
        lastName: 'User',
        password: 'securepassword'
      });

    // Try to register again with the same email
    const response = await request(app)
      .post('/v1/user')
      .send({
        email: 'duplicate@example.com',
        firstName: 'Another',
        lastName: 'User',
        password: 'anotherpassword'
      });

    expect(response.status).toBe(400); // Bad request expected
  });

  test('should get user info', async () => {
    // First, register a user
    const userResponse = await request(app)
      .post('/v1/user')
      .send({
        email: 'info@example.com',
        firstName: 'Info',
        lastName: 'User',
        password: 'securepassword'
      });

    const userId = userResponse.body.id; // Grab the user ID

    // Now get the user details
    const infoResponse = await request(app)
      .get('/v1/user/self')
      .set('Authorization', 'Basic ' + Buffer.from(`${userResponse.body.email}:securepassword`).toString('base64')); // Basic Auth

    expect(infoResponse.status).toBe(200); // Should be 200 for success
    expect(infoResponse.body.email).toBe('info@example.com'); // Check the email
  });

  test('should update user info', async () => {
    // Register a user first
    const userResponse = await request(app)
      .post('/v1/user')
      .send({
        email: 'update@example.com',
        firstName: 'Update',
        lastName: 'User',
        password: 'securepassword'
      });

    const userId = userResponse.body.id; // Get user ID

    // Update user info now
    const updateResponse = await request(app)
      .put('/v1/user/self')
      .set('Authorization', 'Basic ' + Buffer.from(`${userResponse.body.email}:securepassword`).toString('base64'))
      .send({
        firstName: 'UpdatedName',
        lastName: 'UpdatedLast',
        password: 'UpdatedPassword'
      });

    expect(updateResponse.status).toBe(204); // No content expected after successful update

    // Verify the update by getting user info again
    const infoResponse = await request(app)
      .get('/v1/user/self')
      .set('Authorization', 'Basic ' + Buffer.from(`${userResponse.body.email}:UpdatedPassword`).toString('base64'));

    expect(infoResponse.body.firstName).toBe('UpdatedName'); // Check updated first name
    expect(infoResponse.body.lastName).toBe('UpdatedLast'); // Check updated last name
  });
});
