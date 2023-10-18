const { Events } = require('discord.js');
const { channelIds, prefix, regexArgs } = require('../../config.json');
const Streak = require('../streak');

module.exports = {
	name: Events.MessageCreate,
	async execute(interaction) {
		// Only listen to a specific channel
		if (!channelIds.includes(interaction.channelId)) return;

		// Ignore reading bot's own messages
		if (interaction.author.id === interaction.client.user.id) return;

		// Ignore messages that are not prefixed (this also catches non-text messages)
		const messageContent = interaction.content;
		if (messageContent.length < prefix.length && messageContent.substr(0, prefix.length)) return;

		for (const args of regexArgs) {
			const [ re, mode ] = args;
			const pattern = new RegExp(re, mode);
			if (messageContent.match(pattern)) {
				const streak = new Streak(interaction);
				await streak.init();
				await streak.processMessage();
				break;
			}
		}
	},
};