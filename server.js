const express = require("express");
const Sequelize = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
  }
);

const app = express();

app.use(express.json({ type: "*/*" }));

app.get("/healthz", async (req, res) => {
  if (req.body && Object.keys(req.body).length > 0) {
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

app.all("/healthz", async (req, res) => {
  return res
    .status(405)
    .set({
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    })
    .end();
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
