const { SlashCommandBuilder } = require('discord.js');
const Database = require('../../../database/connection');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add-admin')
		.setDescription('Add user to admin')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User who will become admin')
				.setRequired(true)),
	async execute(interaction) {
		const existingAdminUserId = interaction.user.id;
		const newAdminUserId = interaction.options.getUser('user').id;
		const newAdminUsername = interaction.options.getUser('user').username;

		// Disallow targeting self
		if (existingAdminUserId === newAdminUserId) {
			await interaction.reply({ content: 'Nice try! 😒', ephemeral: true });
			return;
		}

		try {
			if (await Database.isAdmin(existingAdminUserId)) {
				if (await Database.isAdmin(newAdminUserId)) {
					await interaction.reply({ content: `${newAdminUsername} is already an admin`, ephemeral: true });
				} else {
					await Database.addAdmin(newAdminUserId, existingAdminUserId);
					await interaction.reply({ content: `Successfully added ${newAdminUsername} as admin`, ephemeral: true });
				}
			} else {
				await interaction.reply({ content: 'You must be an admin to add other admins', ephemeral: true });
			}
		} catch (error) {
			await interaction.reply({ content: `Unable to add ${newAdminUsername} as admin`, ephemeral: true });
		}
	},
};