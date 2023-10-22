const winston = require('winston');

const { timeZone } = require('../../config.json');

const timezoned = () => {
	return new Date().toLocaleString('en-US', {
		timeZone: timeZone,
	});
};

class LoggerFactory {
	static getLogger(userService) {
		const logger = winston.createLogger({
			level: 'info',
			format: winston.format.combine(
				winston.format.timestamp({
					format: timezoned,
				}),
				winston.format.errors({ stack: true }),
				winston.format.splat(),
				winston.format.simple(),
			),
			defaultMeta: { service: userService },
			transports: [
				new winston.transports.File({ filename: `logs/${userService}-error.log`, level: 'error' }),
				new winston.transports.File({ filename: `logs/${userService}.log`, level: 'debug' }),
				new winston.transports.File({ filename: 'logs/all.log', level: 'debug' }),
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