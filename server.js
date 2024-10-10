const express = require("express");
// const Sequelize = require("sequelize");
const dotenv = require("dotenv");
const userRoutes=require('./routes/userRoutes')
const sequelize=require('./config/database')

dotenv.config();




const app = express();

app.use(express.json({ type: "*/*" }));

app.use(userRoutes)

app.head("/healthz", (req, res, next) => {
 
    return res
      .status(405)
      .set({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      })
      .end()

});



// API to handle the get request
app.get("/healthz", async (req, res) => {
  if ((req.body && Object.keys(req.body).length > 0) || Object.keys(req.query).length > 0) {
    return res
      .status(400)
      .set({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      })
      .end();
  }

  try {
    await sequelize.authenticate();
    return res
      .status(200)
      .set({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      })
      .end();
  } catch (error) {
    return res
      .status(503)
      .set({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      })
      .end();
  }
});

// API to handle post, put, delete, patch
app.all("/healthz", async (req, res) => {
  return res
    .status(405)
    .set({
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    })
    .end();
});

// Catch any path parameters for /healthz
app.all("/healthz/*", (req, res) => {
  console.log('path params')
  return res.status(400).end();
});



// app.listen(process.env.PORT, () => {
//   console.log(`Server is running on port ${process.env.PORT}`);
// });

sequelize.sync().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}}`);
  });
}).catch(error => {
  console.error('Unable to connect to the database:', error);
});
module.exports = app;
