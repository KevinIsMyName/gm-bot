function convertStreakStatusToEmoji(streak) {
	if (streak.awaitingRevive) return '👼';
	else if (streak.numberOfDays > 0) return '🔥';
	else return '💀';
}

exports.convertStreakStatusToEmoji = convertStreakStatusToEmoji;