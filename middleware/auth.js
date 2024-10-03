// middleware/auth.js
const bcrypt = require("bcrypt");

const User = require("../models/userModel"); 


// Middleware for basic authentication
const basicAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res
      .status(401)
      .end();
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [email, password] = credentials.split(":");
  if(!email || !password){
    return res.status(401).end()
  }

  try {
    // Find user by email
    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      return res.status(401).end();
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).end();
    }

    // Attach user to request object for further use in the application
    req.user = user;
    next(); 
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
};
module.exports={basicAuth}