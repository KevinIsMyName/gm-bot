require('dotenv').config();
const { Events } = require('discord.js');
const { CHANNEL_ID } = process.env;


module.exports = {
	name: Events.MessageCreate,
	async execute(interaction) {
		// Only listen to a specific channel
		if (interaction.channelId !== CHANNEL_ID) {
			return;
		}

		// Ignore reading bot's own messages
		if (interaction.author.id === interaction.client.user.id) {
			return;
		}
	},
};