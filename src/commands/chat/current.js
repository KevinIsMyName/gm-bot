const path = require('node:path');

const Database = require('../../database/connection');
const LoggerFactory = require('../../util/logger');
const streakToEmoji = require('../../util/streakToEmoji');

const logger = LoggerFactory.getLogger(path.basename(__filename));

function formatSingleStreak(streak) {
	if (!streak) return 'You currently have no streak.\n';
	const responseEmojiPrefix = streakToEmoji.convertStreakStatusToEmoji(streak);
	if (streak.awaitingRevive) return `${responseEmojiPrefix} ${streak.username} is currently on a **revived** ${streak.numberOfDays} days streak.`;
	else if (streak.numberOfDays > 0) return `${responseEmojiPrefix} ${streak.username} is currently on a ${streak.numberOfDays} days streak.`;
	else return `${responseEmojiPrefix} ${streak.username} currently has no streak.`;
}

module.exports = {
	'keyword': 'current',
	'description': 'Show your current streak status',
	'handler': async function(interaction) {
		const messageAuthorUserId = interaction.author.id;
		const replyMessageContent = formatSingleStreak(await Database.getStreakCounterByUserId(messageAuthorUserId));
		logger.debug(replyMessageContent);
		await interaction.reply(replyMessageContent);
		logger.info('Successfully displayed current');
	},
};
