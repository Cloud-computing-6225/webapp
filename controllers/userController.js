const { statsdClient, logger } = require('../stats'); // Import logger and statsdClient from stats.js
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
require('dotenv').config(); 

// To register a new user
const registerUser = async (req, res) => {
  statsdClient.increment('api.registerUser.call_count');
  const startApiTime = Date.now();
  const { firstName, lastName, password, email } = req.body;

  logger.info({ message: 'User registration initiated', email });

  if (!firstName || !lastName || !email || !password) {
    logger.warn({ message: 'Missing required fields for user registration', email });
    return res.status(400).end();
  }

  try {
    const startDbTime = Date.now();
    const existingUser = await User.findOne({ where: { email } });
    statsdClient.timing('db.registerUser.findOne.query_time', Date.now() - startDbTime);

    if (existingUser) {
      logger.warn({ message: 'User already exists', email });
      return res.status(400).end();
    }

    const createUserStartTime = Date.now();
    const user = await User.create({
      email,
      first_name: firstName,
      last_name: lastName,
      password
    });
    statsdClient.timing('db.registerUser.create.query_time', Date.now() - createUserStartTime);

    logger.info({ message: 'User registered successfully', userId: user.id, email });
    const apiDuration = Date.now() - startApiTime;
    statsdClient.timing('api.registerUser.response_time', apiDuration);
    return res.status(201).json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      account_created: user.account_created,
      account_updated: user.account_updated,
    });
  } catch (error) {
    logger.error({ message: 'Error registering user', email, error: error.message });
    return res.status(500).end();
  } finally {
    statsdClient.timing('api.registerUser.response_time', Date.now() - startApiTime);
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
      return res.status(404).end();
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
    return res.status(500).end();
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
    return res.status(400).end();
  }

  try {
    const startDbTime = Date.now();
    const user = await User.findOne({ where: { email: req.user.email } });
    statsdClient.timing('db.updateUser.findOne.query_time', Date.now() - startDbTime);

    if (!user) {
      logger.warn({ message: 'User not found for update', email: req.user.email });
      return res.status(404).end();
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
    return res.status(204).end();
  } catch (error) {
    logger.error({ message: 'Error updating user information', email: req.user.email, error: error.message });
    return res.status(500).end();
  } finally {
    statsdClient.timing('api.updateUser.response_time', Date.now() - startApiTime);
  }
};

module.exports = { registerUser, getUserInfo, updateUser };
