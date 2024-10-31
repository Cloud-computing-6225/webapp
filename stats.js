const StatsD = require('node-statsd');
const { createLogger, format, transports } = require('winston');
const dotenv = require("dotenv");

dotenv.config();

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: '/opt/webapp/app.log' })
  ]
});

const statsdClient = new StatsD({ host: process.env.STATSD_HOST || 'localhost', port: process.env.STATSD_PORT || 8125 });

module.exports = { statsdClient, logger };
