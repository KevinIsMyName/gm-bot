const winston = require('winston');

class LoggerFactory {
	static getLogger(userService) {
		const logger = winston.createLogger({
			level: 'info',
			format: winston.format.combine(
				winston.format.timestamp({
					format: 'YYYY-MM-DD HH:mm:ss',
				}),
				winston.format.errors({ stack: true }),
				winston.format.splat(),
				winston.format.simple(),
			),
			defaultMeta: { service: userService },
			transports: [
				new winston.transports.File({ filename: `logs/${userService}-error.log`, level: 'error' }),
				new winston.transports.File({ filename: `logs/${userService}.log` }),
				new winston.transports.File({ filename: 'logs/all.log' }),
				new winston.transports.Console({ format: winston.format.simple(), level: 'info' }),
			],
		});
		// Compulsory error handling
		logger.on('error', (err) => {
			console.error('Error in logger caught', err);
		});
		logger.debug(`Initialized logger for ${userService}`);
		return logger;
	}
}

module.exports = LoggerFactory;