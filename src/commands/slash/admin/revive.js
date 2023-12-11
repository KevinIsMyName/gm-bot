const path = require('node:path');

const { SlashCommandBuilder } = require('discord.js');

const Database = require('../../../database/database');
const authenticate = require('../../../utils/authenticate');
const LoggerFactory = require('../../../utils/logger');
const Streak = require('../../../utils/streak');

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
		const invokerUsername = interaction.user.username;
		const adminMember = interaction.member;
		const reviveUserId = interaction.options.getUser('user').id;
		const reviveUsername = interaction.options.getUser('user').username;

		let replyMessageContent = '';
		try {
			if (authenticate.isAdmin(adminMember)) {
				if (await Streak.isAlive(reviveUserId)) {
					replyMessageContent = `Revived **${reviveUsername}**'s streak`;
					await Database.setStreakCounterRevive(reviveUserId, true);
					logger.info(replyMessageContent);
					await interaction.reply(replyMessageContent);
				} else {
					replyMessageContent = `**${reviveUsername}**'s streak cannot be revived because it is not dead`;
					logger.warn(replyMessageContent);
					await interaction.reply(replyMessageContent);
				}
			} else {
				replyMessageContent = ' must be an admin to revive other user\'s streaks';
				logger.warn(invokerUsername + replyMessageContent);
				await interaction.reply({ content: 'You' + replyMessageContent, ephemeral: true });
			}
		} catch (err) {
			replyMessageContent = `Unable to add revive **${reviveUsername}**'s streak`;
			logger.error(replyMessageContent);
			logger.error(err);
			await interaction.reply({ content: replyMessageContent, ephemeral: true });
		}
	},
};