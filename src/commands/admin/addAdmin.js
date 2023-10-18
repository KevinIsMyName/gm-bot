const { SlashCommandBuilder } = require('discord.js');
const Database = require('../../database/connection');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add-admin')
		.setDescription('Add user as admin of gm-bot')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User who will become admin')
				.setRequired(true)),
	async execute(interaction) {
		const existingAdminUid = interaction.user.id;
		const newAdminUid = interaction.options.getUser('user').id;
		const newAdminUsername = interaction.options.getUser('user').username;
		if (Database.isAdmin(existingAdminUid)) {
			await Database.addAdmin({ newAdminUid: newAdminUid, existingAdminUid: existingAdminUid });
			await interaction.reply(`Successfully added ${newAdminUsername} as admin`, { ephemerel: true });
		} else {
			await interaction.reply('You must be an admin to add other admins', { ephemeral: true });
		}
	},
};