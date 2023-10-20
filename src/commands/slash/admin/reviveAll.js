const { SlashCommandBuilder } = require('discord.js');
const Database = require('../../../database/connection');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('revive-all')
		.setDescription('Revive everyone\'s streaks'),
	async execute(interaction) {
		const adminUserId = interaction.user.id;

		try {
			if (await Database.isAdmin(adminUserId)) {
				await Database.setAllStreakCountersRevive(true);
				await interaction.reply('Successfully revived everyone\'s streaks');
			} else {
				await interaction.reply({ content: 'You must be an admin to revive everyone\'s streaks', ephemeral: true });
			}
		} catch (error) {
			await interaction.reply({ content: 'Unable to add revive everyone\' streaks', ephemeral: true });
		}
	},
};