// const { createLogger, format, transports } = require('winston');

// const logger = createLogger({
//   level: 'info',
//   format: format.combine(
//     format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//     format.printf(({ level, message, timestamp }) => `${timestamp} ${level.toUpperCase()}: ${message}`)
//   ),
//   transports: [
//     new transports.Console(),
//     new transports.File({ filename: 'logs/app.log' })
//   ]
// });

// module.exports = logger;
const { createLogger, format, transports } = require('winston');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');

// Define custom log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ level, message, timestamp }) => `${timestamp} ${level.toUpperCase()}: ${message}`)
);

const logger = createLogger({
  level: 'info', 
  format: logFormat,
  transports: [
    
    new transports.Console(),
    
    new transports.File({ filename: path.join(logsDir, 'combined.log') }),
   
    new transports.File({
      filename: path.join(logsDir, 'warn.log'),
      level: 'warn',
    }),
   
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
  ],
});

module.exports = logger;