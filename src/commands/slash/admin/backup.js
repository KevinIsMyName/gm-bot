const path = require('node:path');

const { SlashCommandBuilder } = require('discord.js');

const Database = require('../../../database/database');
const authenticate = require('../../../utils/authenticate');
const LoggerFactory = require('../../../utils/logger');

const logger = LoggerFactory.getLogger(path.basename(__filename));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('backup')
		.setDescription('Backup database data'),
	async execute(interaction) {
		const invokerUsername = interaction.user.username;
		const adminMember = interaction.member;

		try {
			if (authenticate.isAdmin(adminMember)) {
				const isBackupSuccessful = await Database.backup();
				logger.error('Backup return code: ' + isBackupSuccessful);
				if (isBackupSuccessful === 0) {
					const replyMessageContent = 'Backup successful';
					await interaction.reply({ content: replyMessageContent, ephemeral: true });
					return;
				}
				const replyMessageContent = 'Backup unsuccessful';
				await interaction.reply({ content: replyMessageContent, ephemeral: true });
				return;

			} else {
				const replyMessageContent = ' must be an admin to backup the database';
				logger.warn(invokerUsername + replyMessageContent);
				await interaction.reply({ content: 'You' + replyMessageContent, ephemeral: true });
			}
		} catch (err) {
			const replyMessageContent = 'Unable to backup database';
			logger.error('Unexpected error: ' + err);
			await interaction.reply({ content: replyMessageContent, ephemeral: true });
		}
	},
};