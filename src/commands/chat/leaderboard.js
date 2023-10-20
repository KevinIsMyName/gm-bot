const Database = require('../../database/connection');
const convertStreakStatusToEmoji = require('../../util/streakToEmoji');

function formatLeaderboard(streaks) {
	if (streaks.length === 0) return 'There are currently no streaks.\n';

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

module.exports = {
	'keyword': 'leaderboard',
	'description': 'Show everyone\'s streaks\' status',
	'handler': async function(interaction) {
		const replyMessageContent = formatLeaderboard(await Database.getAllStreakCounters());
		await interaction.reply(replyMessageContent);
	},
};