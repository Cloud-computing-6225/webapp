const express = require("express");
const dotenv = require("dotenv");
const userRoutes = require('./routes/userRoutes');
const sequelize = require('./config/database');

const { statsdClient, logger } = require('./stats');

// Load environment variables
dotenv.config();

const app = express();

// // Set up Winston Logger for JSON logging
// const logger = createLogger({
//   level: 'info',
//   format: format.combine(
//     format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//     format.json()  // Output logs in JSON format
//   ),
//   transports: [
//     new transports.Console(),
//     new transports.File({ filename: '/opt/webapp/app.log' }) // Logs also saved to a file
//   ]
// });

// // Use environment variables or default values for StatsD
// const statsdHost = process.env.STATSD_HOST || 'localhost';
// const statsdPort = process.env.STATSD_PORT || 8125;
// const statsdClient = new StatsD({ host: statsdHost, port: statsdPort });

// Middleware to parse JSON bodies
app.use(express.json({ type: "*/*" }));

// Routes
app.use(userRoutes);

// Health check endpoints
app.head("/healthz", (req, res) => {
  statsdClient.increment('api.healthz.head.call_count');
  const startApiTime = Date.now();
  
  try {
    logger.info({ message: 'HEAD request received on /healthz' });
    res
      .status(405)
      .set({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      })
      .end();
  } catch (error) {
    logger.error({ message: 'Error processing HEAD request on /healthz', error: error.message });
    res.status(500).end();
  } finally {
    statsdClient.timing('api.healthz.head.response_time', Date.now() - startApiTime);
  }
});

app.get("/healthz", async (req, res) => {
  statsdClient.increment('api.healthz.get.call_count');
  const startApiTime = Date.now();

  try {
    logger.info({ message: 'GET request received on /healthz' });
    await sequelize.authenticate();
    logger.info({ message: 'Database connection successful on /healthz' });
    res
      .status(200)
      .set({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      })
      .end();
  } catch (error) {
    logger.error({ message: 'Database connection error on /healthz', error: error.message });
    res
      .status(503)
      .set({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      })
      .end();
  } finally {
    statsdClient.timing('api.healthz.get.response_time', Date.now() - startApiTime);
  }
});

// Catch-all handler for invalid /healthz methods
app.all("/healthz", (req, res) => {
  statsdClient.increment('api.healthz.invalid_method.call_count');
  const startApiTime = Date.now();

  try {
    logger.warn({ message: 'Invalid method received on /healthz', method: req.method });
    res
      .status(405)
      .set({
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      })
      .end();
  } catch (error) {
    logger.error({ message: 'Error processing invalid method on /healthz', error: error.message });
    res.status(500).end();
  } finally {
    statsdClient.timing('api.healthz.invalid_method.response_time', Date.now() - startApiTime);
  }
});

// Catch any path parameters for /healthz/*
app.all("/healthz/*", (req, res) => {
  statsdClient.increment('api.healthz.invalid_path.call_count');
  const startApiTime = Date.now();

  try {
    logger.warn({ message: 'Invalid path parameter received on /healthz', path: req.path });
    res.status(400).end();
  } catch (error) {
    logger.error({ message: 'Error processing invalid path parameter on /healthz', error: error.message });
    res.status(500).end();
  } finally {
    statsdClient.timing('api.healthz.invalid_path.response_time', Date.now() - startApiTime);
  }
});

// Start the server
const port = process.env.PORT || 8080;
sequelize.sync().then(() => {
  app.listen(port, () => {
    logger.info({ message: `Server started on port ${port}` });
  });
}).catch(error => {
  logger.error({ message: 'Unable to connect to the database on startup', error: error.message });
});

module.exports = { app};
