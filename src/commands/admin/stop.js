const { SlashCommandBuilder } = require('discord.js');
const Database = require('../../database/connection');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops the bot'),
	async execute(interaction) {
		const existingAdminUserId = interaction.user.id;
		try {
			if (await Database.isAdmin(existingAdminUserId)) {
				await interaction.reply('Good night 😴');
				console.log('Received stop command');
				process.exit(0);

			} else {
				await interaction.reply('How about you stop?! 😡', { ephemeral: true });
			}
		} catch (error) {
			await interaction.reply('Something went wrong with trying to stop the bot ', { ephemeral: true });
		}
	},
};