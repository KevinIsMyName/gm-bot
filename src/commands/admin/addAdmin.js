const { SlashCommandBuilder } = require('discord.js');
const Database = require('../../database/connection');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add-admin')
		.setDescription('Add user to admin')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User who will become admin')
				.setRequired(true)),
	async execute(interaction) {
		const existingAdminUid = interaction.user.id;
		const newAdminUid = interaction.options.getUser('user').id;
		const newAdminUsername = interaction.options.getUser('user').username;
		try {
			if (await Database.isAdmin(existingAdminUid)) {
				if (await Database.isAdmin(newAdminUid)) {
					await Database.addAdmin({ newAdminUid: newAdminUid, existingAdminUid: existingAdminUid });
					await interaction.reply(`Successfully added ${newAdminUsername} as admin`, { ephemerel: true });
				} else {
					await interaction.reply(`${newAdminUsername} is already an admin`, { ephemerel: true });
				}
			} else {
				await interaction.reply('You must be an admin to add other admins', { ephemeral: true });
			}
		} catch {
			await interaction.reply(`Unable to add ${newAdminUsername} as admin`, { ephemeral: true });
		}
	},
};