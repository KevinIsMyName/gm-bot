const path = require('node:path');

const { Events } = require('discord.js');

const LoggerFactory = require('../util/logger');

const logger = LoggerFactory.getLogger(path.basename(__filename));

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		logger.info(`Ready! Logged in as ${client.user.tag}`);
	},
};