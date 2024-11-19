const { statsdClient, logger } = require('../stats'); // Import logger and statsdClient from stats.js
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
require('dotenv').config(); 
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const { Sequelize } = require('sequelize');




const sns = new AWS.SNS({
  region: process.env.AWS_REGION, 
});

// To register a new user
const registerUser = async (req, res) => {
  console.log("Started Creating User");

  // Increment API call count in statsd
  statsdClient.increment('api.registerUser.call_count');

  const startApiTime = Date.now();
  const { firstName, lastName, password, email } = req.body;

  console.log("Received user data:", { firstName, lastName, email });

  logger.info({ message: 'User registration initiated', email });

  if (!firstName || !lastName || !email || !password) {
    logger.warn({ message: 'Missing required fields for user registration', email });
    console.log("Error: Missing required fields for user registration");
    return res.status(400).json({ code: 400 });
  }

  try {
    console.log("Checking if user already exists...");
    const startDbTime = Date.now();
    const existingUser = await User.findOne({ where: { email } });
    statsdClient.timing('db.registerUser.findOne.query_time', Date.now() - startDbTime);

    if (existingUser) {
      logger.warn({ message: 'User already exists', email });
      console.log(`User with email ${email} already exists.`);
      return res.status(400).json({ code: 400 });
    }

    // Generate a verification token
    const token = uuidv4();
    const expiry = new Date(Date.now() + 2 * 60 * 1000);

    console.log("Creating new user in the database...");
    const createUserStartTime = Date.now();
    const user = await User.create({
      email,
      first_name: firstName,
      last_name: lastName,
      password: password,
      email_verified: false,
      email_verification_token: token,
      email_verification_expiry: expiry,
    });

    statsdClient.timing('db.registerUser.create.query_time', Date.now() - createUserStartTime);

    console.log("User created:", user.id, user.email);

    // Publish the token and user details to SNS
    const params = {
      TopicArn: process.env.SNS_TOPIC_ARN, // Set your SNS topic ARN in environment variables
      Message: JSON.stringify({
        email: user.email,
        token,
      }),
    };

    console.log("Publishing verification email via SNS...");
    await sns.publish(params).promise()
  .then(data => {
    console.log("SNS message sent successfully:", data);
  })
  .catch(err => {
    console.error("Error sending SNS message:", err);
  });
    console.log(`Verification email sent to ${user.email}`);

    logger.info({ message: 'User registered successfully', userId: user.id, email });

    const apiDuration = Date.now() - startApiTime;
    statsdClient.timing('api.registerUser.response_time', apiDuration);

    // Respond with success
    return res.status(201).json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      account_created: user.account_created,
      account_updated: user.account_updated,
      message: 'User registered successfully. Verification email sent.',
    });
  } catch (error) {
    logger.error({ message: 'Error registering user', email, error: error.message });
    console.log("Error during registration:", error);
    return res.status(500).json({ code: 500 });
  } finally {
    statsdClient.timing('api.registerUser.response_time', Date.now() - startApiTime);
    console.log("User registration process completed.");
  }
};


// To get user information
const getUserInfo = async (req, res) => {
  statsdClient.increment('api.getUserInfo.call_count');
  const startApiTime = Date.now();

  logger.info({ message: 'Fetching user information', email: req.user.email });

  try {
    const startDbTime = Date.now();
    const user = await User.findOne({ where: { email: req.user.email } });
    statsdClient.timing('db.getUserInfo.findOne.query_time', Date.now() - startDbTime);

    if (!user) {
      logger.warn({ message: 'User not found', email: req.user.email });
      return res.status(404).json({ code: 404 });
    }

    logger.info({ message: 'User information retrieved successfully', userId: user.id, email: req.user.email });
    statsdClient.timing('api.getUserInfo.response_time', Date.now() - startApiTime);
    return res.status(200).json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      account_created: user.account_created,
      account_updated: user.account_updated,
    });
  } catch (error) {
    logger.error({ message: 'Error fetching user information', email: req.user.email, error: error.message });
    return res.status(500).json({ code: 500 });
  } finally {
    statsdClient.timing('api.getUserInfo.response_time', Date.now() - startApiTime);
  }
};

// To update user information
const updateUser = async (req, res) => {
  statsdClient.increment('api.updateUser.call_count');
  const startApiTime = Date.now();

  const { firstName, lastName, password } = req.body;
  logger.info({ message: 'Updating user information', email: req.user.email });

  if (!firstName || !lastName || !password) {
    logger.warn({ message: 'Missing required fields for user update', email: req.user.email });
    return res.status(400).json({ code: 400 });
  }

  try {
    const startDbTime = Date.now();
    const user = await User.findOne({ where: { email: req.user.email } });
    statsdClient.timing('db.updateUser.findOne.query_time', Date.now() - startDbTime);

    if (!user) {
      logger.warn({ message: 'User not found for update', email: req.user.email });
      return res.status(404).json({ code: 404 });
    }

    const updateStartTime = Date.now();
    user.first_name = firstName;
    user.last_name = lastName;
    user.password = password;
    user.account_updated = new Date();
    await user.save();
    statsdClient.timing('db.updateUser.save.query_time', Date.now() - updateStartTime);

    logger.info({ message: 'User information updated successfully', userId: user.id, email: req.user.email });
    statsdClient.timing('api.updateUser.response_time', Date.now() - startApiTime);
    return res.status(204).json({ code: 204 });
  } catch (error) {
    logger.error({ message: 'Error updating user information', email: req.user.email, error: error.message });
    return res.status(500).json({ code: 500 });
  } finally {
    statsdClient.timing('api.updateUser.response_time', Date.now() - startApiTime);
  }
};


const verifyEmail = async (req, res) => {
  const { email, token } = req.query;

  try {
    // Find the user and check the token and expiry
    const user = await User.findOne({
      where: {
        email,
        email_verification_token: token,
        email_verification_expiry: { [Sequelize.Op.gt]: new Date() }, // Check if token is not expired
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update the user's email_verified field and clear the token
    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expiry = null;
    await user.save();

    return res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
module.exports = { registerUser, getUserInfo, updateUser,verifyEmail };
