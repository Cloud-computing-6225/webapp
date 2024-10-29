const bcrypt = require("bcrypt");
const User = require("../models/userModel");

// To register a new user
const registerUser = async (req, res) => {
  statsdClient.increment('api.registerUser.call_count');  // Increment API call count
  const startApiTime = Date.now();  // Start timer for API response time

  const { firstName, lastName, password, email } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).end();
  }

  try {
    const startDbTime = Date.now();  // Start timer for DB query time
    const existingUser = await User.findOne({ where: { email: email } });
    statsdClient.timing('db.registerUser.findOne.query_time', Date.now() - startDbTime);  // Log DB query time

    if (existingUser) {
      return res.status(400).end();
    }

    const createUserStartTime = Date.now();  // Timer for user creation
    const user = await User.create({ email, firstName, lastName, password });
    statsdClient.timing('db.registerUser.create.query_time', Date.now() - createUserStartTime);  // Log DB query time

    return res.status(201).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      account_created: user.account_created,
      account_updated: user.account_updated,
    });
  } catch (error) {
    res.status(500).end();
  } finally {
    statsdClient.timing('api.registerUser.response_time', Date.now() - startApiTime);  // Log total API response time
  }
};


// To get user information
const getUserInfo = async (req, res) => {
  statsdClient.increment('api.getUserInfo.call_count');  // Increment API call count
  const startApiTime = Date.now();  // Start timer for API response time

  try {
    const startDbTime = Date.now();  // Start timer for DB query time
    const user = await User.findOne({ where: { email: req.user.email } });
    statsdClient.timing('db.getUserInfo.findOne.query_time', Date.now() - startDbTime);  // Log DB query time

    if (!user) {
      return res.status(404).end();
    }
    
    return res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      account_created: user.account_created,
      account_updated: user.account_updated,
    });
  } catch (error) {
    return res.status(500).end();
  } finally {
    statsdClient.timing('api.getUserInfo.response_time', Date.now() - startApiTime);  // Log total API response time
  }
};


// To update user information
const updateUser = async (req, res) => {
  statsdClient.increment('api.updateUser.call_count');  // Increment API call count
  const startApiTime = Date.now();  // Start timer for API response time

  const { firstName, lastName, password } = req.body;
  if (!firstName || !lastName || !password) {
    return res.status(400).end();
  }

  try {
    const startDbTime = Date.now();  // Start timer for DB query time
    const user = await User.findOne({ where: { email: req.user.email } });
    statsdClient.timing('db.updateUser.findOne.query_time', Date.now() - startDbTime);  // Log DB query time

    if (!user) {
      return res.status(404).end();
    }

    // Updating the user and logging the time taken
    const updateStartTime = Date.now();
    user.firstName = firstName;
    user.lastName = lastName;
    user.password = password;
    user.account_updated = new Date();
    await user.save();
    statsdClient.timing('db.updateUser.save.query_time', Date.now() - updateStartTime);  // Log DB save time

    return res.status(204).end();
  } catch (error) {
    return res.status(500).end();
  } finally {
    statsdClient.timing('api.updateUser.response_time', Date.now() - startApiTime);  // Log total API response time
  }
};


module.exports = { registerUser, getUserInfo, updateUser };
