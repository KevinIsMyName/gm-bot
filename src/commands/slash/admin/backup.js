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
		const authorUsername = interaction.author.username;
		const adminMember = interaction.member;

		try {
			if (authenticate.isAdmin(adminMember)) {
				const backupSuccessful = await Database.backup();
				if (backupSuccessful === 0) {
					const replyMessageContent = 'Backup successful';
					await interaction.reply({ content: replyMessageContent, ephemeral: true });
					return;
				}
				const replyMessageContent = 'Backup unsuccessful';
				await interaction.reply({ content: replyMessageContent, ephemeral: true });
				return;

			} else {
				const replyMessageContent = 'You must be an admin to backup the database';
				await interaction.reply({ content: replyMessageContent, ephemeral: true });
			}
		} catch (err) {
			const replyMessageContent = 'Unable to backup database';
			logger.error('Unexpected error: ' + err);
			await interaction.reply({ content: replyMessageContent, ephemeral: true });
		}
	},
};