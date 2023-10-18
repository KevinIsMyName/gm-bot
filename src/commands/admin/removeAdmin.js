const { SlashCommandBuilder } = require('discord.js');
const Database = require('../../database/connection');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove-admin')
		.setDescription('Remove admin user')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User who will no longer be admin')
				.setRequired(true)),
	async execute(interaction) {
		const existingAdminUid = interaction.user.id;
		const removeAdminUid = interaction.options.getUser('user').id;
		const removeAdminUsername = interaction.options.getUser('user').username;
		try {
			if (await Database.isAdmin(existingAdminUid)) {
				await Database.removeAdmin({ removeAdminUid: removeAdminUid, existingAdminUid: existingAdminUid });
				await interaction.reply(`Successfully removed ${removeAdminUsername} from admin`, { ephemerel: true });
			} else {
				await interaction.reply('You must be an admin to remove other admins', { ephemeral: true });
			}
		} catch {
			await interaction.reply(`Unable to remove ${removeAdminUsername} as admin`, { ephemeral: true });
		}
	},
};