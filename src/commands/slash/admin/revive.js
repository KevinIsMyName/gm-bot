const { SlashCommandBuilder } = require('discord.js');
const Database = require('../../../database/connection');
const authenticate = require('../../../util/authenticate');

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

		try {
			if (authenticate.isAdmin(adminMember)) {
				await Database.setStreakCounterRevive(reviveUserId, true);
				await interaction.reply(`Successfully revived ${reviveUsername}'s streak`);
			} else {
				await interaction.reply({ content: 'You must be an admin to revive other user\'s streaks', ephemeral: true });
			}
		} catch (error) {
			await interaction.reply({ content: `Unable to add revive ${reviveUsername}'s streak`, ephemeral: true });
		}
	},
};