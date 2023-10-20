const { SlashCommandBuilder } = require('discord.js');
const Database = require('../../../database/connection');

async function addAdminUser(interaction) {
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
}

async function removeAdminUser(interaction) {
	const existingAdminUserId = interaction.user.id;
	const removeAdminUserId = interaction.options.getUser('user').id;
	const removeAdminUsername = interaction.options.getUser('user').username;

	// Disallow targeting self
	if (existingAdminUserId === removeAdminUserId) {
		await interaction.reply({ content: 'Did you mean to remove yourself from admin? I don\'t think so...try asking another admin to do it for you 🤔', ephemeral : true });
		return;
	}

	try {
		if (await Database.isAdmin(existingAdminUserId)) {
			if (await Database.isAdmin(removeAdminUserId)) {
				await Database.removeAdmin(removeAdminUserId);
				await interaction.reply({ content: `Successfully removed ${removeAdminUsername} from admin`, ephemeral: true });
			} else {
				await interaction.reply({ content: `${removeAdminUsername} is already not an admin`, ephemeral: true });
			}
		} else {
			await interaction.reply({ content: 'You must be an admin to remove other admins', ephemeral: true });
		}
	} catch (error) {
		await interaction.reply({ content: `Unable to remove ${removeAdminUsername} as admin`, ephemeral: true });
	}
}


module.exports = {
	data: new SlashCommandBuilder()
		.setName('admin')
		.setDescription('Admin management commands')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('Add user to admin')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('User who will become admin')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setDescription('Remove user from admin')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('User who will no longer be admin')
						.setRequired(true))),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case 'add':
				await addAdminUser(interaction);
				break;
			case 'remove':
				await removeAdminUser(interaction);
				break;
		}

	},
};