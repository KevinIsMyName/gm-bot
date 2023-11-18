const path = require('node:path');

const { SlashCommandBuilder } = require('discord.js');

const Database = require('../../../database/database');
const LoggerFactory = require('../../../utils/logger');
const authenticate = require('../../../utils/authenticate');

const logger = LoggerFactory.getLogger(path.basename(__filename));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops the bot'),
	async execute(interaction) {
		const adminMember = interaction.member;
		const adminUsername = interaction.user.username;

		try {
			if (authenticate.isAdmin(adminMember)) {
				await interaction.reply('Good night 😴');
				logger.info('Received stop command');
				process.exit(0);

			} else {
				logger.info(`${adminUsername} attempted to stop the bot but is not an admin`);
				await interaction.reply({ content: 'How about you stop?! 😡', ephemeral: true });
			}
		} catch (err) {
			const replyMessageContent = 'Something went wrong with trying to stop the bot ';
			logger.error(replyMessageContent);
			logger.error(err);
			await interaction.reply({ content: replyMessageContent, ephemeral: true });
		}
	},
};