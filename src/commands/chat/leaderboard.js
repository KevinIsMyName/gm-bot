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

function formatLeaderboard(streakCounterRows) {
	if (streakCounterRows.length === 0) return 'There are currently no streaks.\n';

	const numStreaks = streakCounterRows.length;
	const numDigits = countDigits(numStreaks);
	let response = '';
	let i = 1;
	const prevStreak = { rank: i, numOfDays: null };
	streakCounterRows.forEach(row => {
		response += `${streakToEmoji.convertStreakStatusToEmoji(row)}`;
		if (prevStreak.numOfDays === row.numberOfDays) {
			response += `\` ${String(prevStreak.rank).padStart(numDigits, ' ')} |\` **${row.username}** (${row.numberOfDays} days)\n`;
		} else {
			response += `\` ${String(i).padStart(numDigits, ' ')} |\` **${row.username}** (${(row.numberOfDays === 0) ? `was ${row.reviveNumberOfDays}` : `${row.numberOfDays}`} days)\n`;
			prevStreak.rank = i;
			prevStreak.numOfDays = row.numberOfDays;
		}
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