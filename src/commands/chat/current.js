const path = require('node:path');

const Database = require('../../database/database');
const LoggerFactory = require('../../utils/logger');
const streakToEmoji = require('../../utils/streakToEmoji');

const logger = LoggerFactory.getLogger(path.basename(__filename));

function formatSingleStreak(streakCounter) {
	if (!streakCounter) return 'You currently have no streak.\n';
	const responseEmojiPrefix = streakToEmoji.convertStreakStatusToEmoji(streakCounter);
	if (streakCounter.awaitingRevive) return `${responseEmojiPrefix} ${streakCounter.username} is currently on a **revived** ${streakCounter.reviveNumberOfDays} days streak.`;
	else if (streakCounter.numberOfDays > 0) return `${responseEmojiPrefix} ${streakCounter.username} is currently on a ${streakCounter.numberOfDays} days streak.`;
	else if (streakCounter.numberOfDays === 0) return `${responseEmojiPrefix} ${streakCounter.username} is currently not on a streak. ${streakCounter.username}'s last streak lasted ${streakCounter.reviveNumberOfDays} days.`;
	else return `${responseEmojiPrefix} ${streakCounter.username} currently has no ongoing streak.`;
}

module.exports = {
	'keyword': 'current',
	'description': 'Show your current streak status',
	'handler': async function(interaction) {
		const messageAuthorUserId = interaction.author.id;
		const replyMessageContent = formatSingleStreak(await Database.getStreakCounter(messageAuthorUserId));
		logger.debug(replyMessageContent);
		await interaction.reply({ content: replyMessageContent, ephemeral: true });
		logger.info('Successfully displayed current');
	},
};
