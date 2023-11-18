const path = require('node:path');

const { Events } = require('discord.js');

const LoggerFactory = require('../utils/logger');

const logger = LoggerFactory.getLogger(path.basename(__filename));

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			logger.warn(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			logger.info(`${interaction.user.username} used /${interaction.commandName}`);
			await command.execute(interaction);
		} catch (err) {
			logger.error(`Error executing ${interaction.commandName}`);
			logger.error(err);
		}
	},
};