const { SlashCommandBuilder } = require('discord.js');
const Database = require('../../database/connection');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('Revive')
		.setDescription('Revive streak of a user')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User whose streak should be revived')
				.setRequired(true)),
	async execute(interaction) {
		const adminUserId = interaction.user.id;
		const reviveUserId = interaction.options.getUser('user').id;
		const reviveUsername = interaction.options.getUser('user').username;

		try {
			if (await Database.isAdmin(adminUserId)) {
				await Database.reviveStreak(reviveUserId);
			} else {
				await interaction.reply('You must be an admin to revive other user\'s streaks', { ephemeral: true });
			}
		} catch (error) {
			await interaction.reply(`Unable to add revive ${reviveUsername}'s streak`, { ephemeral: true });
		}
	},
};