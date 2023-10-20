const { SlashCommandBuilder } = require('discord.js');

const Database = require('../../../database/connection');
const authenticate = require('../../../util/authenticate');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops the bot'),
	async execute(interaction) {
		const adminMember = interaction.member;

		try {
			if (authenticate.isAdmin(adminMember)) {
				await interaction.reply('Good night 😴');
				console.log('Received stop command');
				process.exit(0);

			} else {
				await interaction.reply({ content: 'How about you stop?! 😡', ephemeral: true });
			}
		} catch (error) {
			await interaction.reply({ content: 'Something went wrong with trying to stop the bot ', ephemeral: true });
		}
	},
};