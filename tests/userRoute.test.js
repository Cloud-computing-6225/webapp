const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes'); 
const sequelize = require('../config/database'); 

const app = express();
app.use(express.json());
app.use(userRoutes);

describe('User Routes Tests', () => {
  
  // Used to cync model with db
  beforeAll(async () => {
    // Dropping tables and recreating
    await sequelize.sync({force: true}); 
  });

  // Cleanup after all tests
  afterAll(async () => {
    await sequelize.close(); 
  });

  test('should register a new user', async () => {
    const response = await request(app)
      .post('/v1/user')
      .send({
        email: 'kegister@example.com',
        firstName: 'Register',
        lastName: 'User',
        password: 'securepassword'
      });
      
    expect(response.status).toBe(201); 
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('kegister@example.com'); 
  });

  test('should not register a user with existing email', async () => {
    // Creating a new user
    await request(app)
      .post('/v1/user')
      .send({
        email: 'duplicate@example.com',
        firstName: 'Duplicate',
        lastName: 'User',
        password: 'securepassword'
      });

    //Try creating anothe ruser with same mail
    const response = await request(app)
      .post('/v1/user')
      .send({
        email: 'duplicate@example.com',
        firstName: 'Another',
        lastName: 'User',
        password: 'anotherpassword'
      });

    expect(response.status).toBe(400); 
  });

  test('should get user info', async () => {
    // Creating a new user
    const userResponse = await request(app)
      .post('/v1/user')
      .send({
        email: 'info@example.com',
        firstName: 'Info',
        lastName: 'User',
        password: 'securepassword'
      });

    const userId = userResponse.body.id; 

    
    const infoResponse = await request(app)
      .get('/v1/user/self')
      .set('Authorization', 'Basic ' + Buffer.from(`${userResponse.body.email}:securepassword`).toString('base64')); // Basic Auth

    expect(infoResponse.status).toBe(200); // Should be 200 for success
    expect(infoResponse.body.email).toBe('info@example.com'); // Check the email
  });

  test('should update user info', async () => {
    // Creating a new user
    const userResponse = await request(app)
      .post('/v1/user')
      .send({
        email: 'update@example.com',
        firstName: 'Update',
        lastName: 'User',
        password: 'securepassword'
      });

    const userId = userResponse.body.id; // Get user ID

    // Update user info n
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
