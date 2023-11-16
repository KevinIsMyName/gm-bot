const path = require('node:path');

const Database = require('../../database/database');
const LoggerFactory = require('../../utils/logger');
const streakToEmoji = require('../../utils/streakToEmoji');

const logger = LoggerFactory.getLogger(path.basename(__filename));


function formatGraveyard(streakCounterRows) {
	if (streakCounterRows.length === 0) return 'There are currently no streaks.\n';

	let response = '';
	streakCounterRows.forEach(row => {
		response += `${streakToEmoji.convertStreakStatusToEmoji(row)} **${row.username}** (was ${row.reviveNumberOfDays} days)\n`;
	});
	return response;
}

module.exports = {
	'keyword': 'graveyard',
	'description': 'Show all dead streaks',
	'handler': async function(interaction) {
		const replyMessageContent = formatGraveyard(await Database.getAllDeadStreakCounters());
		logger.debug(replyMessageContent);
		await interaction.reply(replyMessageContent);
		logger.info('Successfully displayed graveyard');
	},
};