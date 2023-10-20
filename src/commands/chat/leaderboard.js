const path = require('node:path');

const Database = require('../../database/database');
const LoggerFactory = require('../../utils/logger');
const streakToEmoji = require('../../utils/streakToEmoji');

const logger = LoggerFactory.getLogger(path.basename(__filename));

function countDigits(n) {
	let count = 0;
	while (n != 0) {
		n = Math.floor(n / 10);
		count++;
	}
	return count;
}

function formatLeaderboard(streakRows) {
	if (streakRows.length === 0) return 'There are currently no streaks.\n';

	const numStreaks = streakRows.length;
	const numDigits = countDigits(numStreaks);
	let response = '';
	let i = 1;
	streakRows.forEach(streak => {
		response += `${streakToEmoji.convertStreakStatusToEmoji(streak)} `;
		response += `\` ${String(i).padStart(numDigits, ' ')} |\` ${streak.username} \`:\` ${streak.numberOfDays} days\n`;
		i += 1;
	});
	return response;
}

module.exports = {
	'keyword': 'leaderboard',
	'description': 'Show everyone\'s streaks\' status',
	'handler': async function(interaction) {
		const replyMessageContent = formatLeaderboard(await Database.getAllStreakCounters());
		logger.debug(replyMessageContent);
		await interaction.reply(replyMessageContent);
		logger.info('Successfully displayed leaderboard');
	},
};