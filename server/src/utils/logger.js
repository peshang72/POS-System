const winston = require("winston");
const path = require("path");

// Define log format
const logFormat = winston.format.printf(
  ({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  }
);

// Create logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: "pos-api" },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    // File transports
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
    }),
  ],
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;
