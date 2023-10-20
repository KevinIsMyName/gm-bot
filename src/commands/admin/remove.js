const { SlashCommandBuilder } = require('discord.js');
const Database = require('../../database/connection');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove-admin')
		.setDescription('Remove user from admin')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User who will no longer be admin')
				.setRequired(true)),
	async execute(interaction) {
		const existingAdminUserId = interaction.user.id;
		const removeAdminUserId = interaction.options.getUser('user').id;
		const removeAdminUsername = interaction.options.getUser('user').username;

		// Disallow targeting self
		if (existingAdminUserId === removeAdminUserId) {
			await interaction.reply('Did you mean to remove yourself from admin? I don\'t think so...try asking another admin to do it for you 🤔', { ephemeral : true });
			return;
		}

		try {
			if (await Database.isAdmin(existingAdminUserId)) {
				if (await Database.isAdmin(removeAdminUserId)) {
					await Database.removeAdmin(removeAdminUserId);
					await interaction.reply(`Successfully removed ${removeAdminUsername} from admin`, { ephemeral: true });
				} else {
					await interaction.reply(`${removeAdminUsername} is already not an admin`, { ephemeral: true });
				}
			} else {
				await interaction.reply('You must be an admin to remove other admins', { ephemeral: true });
			}
		} catch (error) {
			await interaction.reply(`Unable to remove ${removeAdminUsername} as admin`, { ephemeral: true });
		}
	},
};