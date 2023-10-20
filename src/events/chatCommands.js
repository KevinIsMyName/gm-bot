const { Events } = require('discord.js');
const { channelIds, prefix, regexArgs } = require('../../config.json');
const Streak = require('../streak');
const Database = require('../database/connection');

function formatLeaderboard(streaks) {
	if (!streaks) return 'There are currently no streaks.\n';

	let response = '';
	let i = 1;
	streaks.forEach(streak => {
		response += `${convertStreakStatusToEmoji(streak)} `;
		response += `\`${i} -\` ${streak.username} : ${streak.numberOfDays} days`;
		response += '\n';
		i += 1;
	});
	return response;
}

function formatSingleStreak(streak) {
	if (!streak) return 'No streak was found for you.\n';
	const responseEmojiPrefix = convertStreakStatusToEmoji(streak);
	if (streak.awaitingRevive) return `${responseEmojiPrefix} ${streak.username} is currently on a **revived** ${streak.numberOfDays} days streak.`;
	else if (streak.numberOfDays > 0) return `${responseEmojiPrefix} ${streak.username} is currently on a ${streak.numberOfDays} days streak.`;
	else return `${responseEmojiPrefix} ${streak.username} currently has no streak.`;
}

function convertStreakStatusToEmoji(streak) {
	if (streak.awaitingRevive) return '👼';
	else if (streak.numberOfDays > 0) return '🔥';
	else return '💀';
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
		const messageAuthorUserId = interaction.author.id;
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
		if (command === 'leaderboard') {
			replyMessageContent = formatLeaderboard(await Database.getAllStreakCounters());
			await interaction.reply(replyMessageContent);
		} else if (command === 'current') {
			replyMessageContent = formatSingleStreak(await Database.getStreakCounterByUserId(messageAuthorUserId));
			await interaction.reply(replyMessageContent);
		}
	},
};