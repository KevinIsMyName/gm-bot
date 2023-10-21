function convertStreakStatusToEmoji(streakCounter) {
	if (streakCounter.awaitingRevive) return '👼';
	else if (streakCounter.numberOfDays > 0) return '🔥';
	else return '💀';
}

exports.convertStreakStatusToEmoji = convertStreakStatusToEmoji;