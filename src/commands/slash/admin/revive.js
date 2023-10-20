const path = require('node:path');

const { SlashCommandBuilder } = require('discord.js');

const Database = require('../../../database/connection');
const authenticate = require('../../../util/authenticate');
const LoggerFactory = require('../../../util/logger');

const logger = LoggerFactory.getLogger(path.basename(__filename));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('revive')
		.setDescription('Revive streak of a user')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User whose streak should be revived')
				.setRequired(true)),
	async execute(interaction) {
		const adminMember = interaction.member;
		const reviveUserId = interaction.options.getUser('user').id;
		const reviveUsername = interaction.options.getUser('user').username;

		let replyMessageContent = '';
		try {
			if (authenticate.isAdmin(adminMember)) {
				await Database.setStreakCounterRevive(reviveUserId, true);
				replyMessageContent = `Successfully revived ${reviveUsername}'s streak`;
				logger.info(replyMessageContent);
				await interaction.reply(replyMessageContent);
			} else {
				replyMessageContent = 'You must be an admin to revive other user\'s streaks';
				logger.warn(replyMessageContent);
				await interaction.reply({ content: replyMessageContent, ephemeral: true });
			}
		} catch (err) {
			replyMessageContent = `Unable to add revive ${reviveUsername}'s streak`;
			logger.error(replyMessageContent);
			logger.error(err);
			await interaction.reply({ content: replyMessageContent, ephemeral: true });
		}
	},
};