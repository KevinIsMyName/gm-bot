const { Events } = require('discord.js');
const { channelIds } = require('../../config.json');


module.exports = {
	name: Events.MessageCreate,
	async execute(interaction) {
		// Only listen to a specific channel
		if (channelIds.includes(interaction.channelId)) {
			return;
		}

		// Ignore reading bot's own messages
		if (interaction.author.id === interaction.client.user.id) {
			return;
		}
	},
};