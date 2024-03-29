const path = require('node:path');

const { SlashCommandBuilder } = require('discord.js');

const Database = require('../../../database/database');
const authenticate = require('../../../utils/authenticate');
const LoggerFactory = require('../../../utils/logger');

const logger = LoggerFactory.getLogger(path.basename(__filename));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('revive-all')
		.setDescription('Revive everyone\'s streaks'),
	async execute(interaction) {
		const invokerUsername = interaction.user.username;
		const adminMember = interaction.member;

		let replyMessageContent = '';
		try {
			if (authenticate.isAdmin(adminMember)) {
				await Database.setAllStreakCountersRevive(true);
				replyMessageContent = 'Successfully revived everyone\'s streaks';
				logger.debug(replyMessageContent);
				await interaction.reply(replyMessageContent);
			} else {
				replyMessageContent = ' must be an admin to revive everyone\'s streaks';
				logger.warn(invokerUsername + replyMessageContent);
				await interaction.reply({ content: 'You' + replyMessageContent, ephemeral: true });
			}
		} catch (err) {
			replyMessageContent = 'Unable to add revive everyone\' streaks';
			logger.error(replyMessageContent);
			await interaction.reply({ content: replyMessageContent, ephemeral: true });
		}
	},
};