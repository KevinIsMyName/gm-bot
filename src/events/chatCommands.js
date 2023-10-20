const { Events } = require('discord.js');
const { channelIds, prefix, regexArgs } = require('../../config.json');
const Streak = require('../streak');
const Database = require('../database/connection');

function parseLeaderboard(databaseRows) {
	let response = '';
	let i = 1;
	for (const streak of databaseRows) {
		if (streak.numberOfDays > 0) response += '🔥 ';
		else if (streak.awaitingRevive) response += '👼 ';
		else response += '💀 ';
		response += `\`${i} -\` ${streak.username}\n`;
		i += 1;
	}
	// response = response.substring(0, response.length - 2); // Remove the last endline
	return response;
}

module.exports = {
	name: Events.MessageCreate,
	async execute(interaction) {
		// Only listen to a specific channel
		if (!channelIds.includes(interaction.channelId)) return;

		// Ignore reading bot's own messages
		if (interaction.author.id === interaction.client.user.id) return;

		// Process streak messages messages
		const messageContent = interaction.content;
		for (const args of regexArgs) {
			const [ re, mode ] = args;
			const pattern = new RegExp(re, mode);
			if (messageContent.match(pattern)) {
				const streak = new Streak(interaction);
				await streak.init();

				const status = await streak.processMessage();
				let emoji = null;
				switch (status) {
					case 'continueStreak':
						emoji = '☀';
						break;
					case 'sameDay':
						emoji = '😴';
						break;
					case 'newStreak':
						emoji = '🌞';
						break;
					default:
						emoji = '❓';
						break;
				}
				interaction.react(emoji);
				return;
			}
		}

		// Ignore messages that are not prefixed
		if (messageContent.length < prefix.length && messageContent.substring(0, prefix.length) != prefix) return;

		const command = messageContent.substring(prefix.length, messageContent.length);
		let replyMessageContent = '';
		switch (command) {
			case 'leaderboard':
				replyMessageContent = parseLeaderboard(await Database.getAllStreakCounters());
				break;
			case 'current':
				break;
			default:
				break;
		}
		await interaction.reply(replyMessageContent);
	},
};