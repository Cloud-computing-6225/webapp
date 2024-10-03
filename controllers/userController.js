const bcrypt = require("bcrypt");
const User = require("../models/userModel");

// To register a new user
const registerUser = async (req, res) => {
  const { firstName, lastName, password, email } = req.body;
  console.log("Inside");
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).end();
  }
  

  const allowedParams = ['firstName', 'lastName', 'password', 'email'];
  const requestParams = Object.keys(req.body);

  // Check if any additional parameters are present
  const additionalParams = requestParams.filter(param => !allowedParams.includes(param));
  if (additionalParams.length > 0) {
    return res.status(400).end();
  }

  // Validate field formats
  if (firstName.length < 2 || lastName.length < 2) {
    return res.status(400).end();
  }

  if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
    return res.status(400).end();
  }

  if (password.length < 4) {
    return res.status(400).end();
  }

  const existingUser = await User.findOne({ where: { email: email } });

  if (existingUser) {
    return res.status(400).end();
  }
  try {
    const user = await User.create({ email, firstName, lastName, password });
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
  }
};

// To get user information
const getUserInfo = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.user.email } });
    if (!user) {
      return res.status(404).end();
    }
    
    return res.status(200).json({
      id:user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      account_created: user.account_created,
      account_updated: user.account_updated,
    });
  } catch (error) {
    return res.status(500).end();
  }
};

// To update user information
const updateUser = async (req, res) => {
  
  const { firstName, lastName, password } = req.body;

  if (!firstName || !lastName ||  !password) {
    return res.status(400).end();
  }
  console.log(firstName, lastName, password);

  const allowedParams = ['firstName', 'lastName', 'password'];
  const requestParams = Object.keys(req.body);

  // Check if any additional parameters are present
  const additionalParams = requestParams.filter(param => !allowedParams.includes(param));
  if (additionalParams.length > 0) {
    return res.status(400).end();
  }
   // Validate field formats
   if (firstName.length < 2 || lastName.length < 2) {
    return res.status(400).end();
  }


  if (password.length < 4) {
    console.log('SHORT')
    return res.status(400).end();
  }

  try {
    const user = await User.findOne({ where: { email: req.user.email } });
    if (!user) {
      return res.status(404).end();
    }
      user.firstName = firstName;
      user.lastName = lastName;
      user.password = password;
    user.account_updated = new Date();
    await user.save();

    return res.status(204).end()
    
  } catch (error) {
    return res.status(500).end();
  }
};

module.exports = { registerUser, getUserInfo, updateUser };
