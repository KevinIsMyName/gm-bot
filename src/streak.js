const Database = require('./database/connection');
const { fromUnixTime } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');
const { timeZone } = require('../config.json');

function unixTimestampToDate(unixTimestamp) {
	return new Date(utcToZonedTime(fromUnixTime(unixTimestamp / 1000), timeZone).toDateString()); // Hacky way to truncate time
}

function oneDayAfterAnother(unixTimestamp1, unixTimestamp2) {
	const date1 = unixTimestampToDate(unixTimestamp1);
	const date2 = unixTimestampToDate(unixTimestamp2);
	return Math.abs(date1.getTime() - date2.getTime()) == 86400000;
}

function sameDay(unixTimestamp1, unixTimestamp2) {
	return unixTimestampToDate(unixTimestamp1).getTime() == unixTimestampToDate(unixTimestamp2).getTime();
}


class Streak {
	constructor(discordInteraction) {
		this.discordInteraction = discordInteraction;
		this.username = discordInteraction.author.username;
		this.userId = discordInteraction.author.id;
	}

	async processMessage() {
		const messageContent = this.discordInteraction.content;
		const lastTimestamp = await Database.getLastTimestamp(this.userId);
		const currentTimestamp = this.discordInteraction.createdTimestamp;
		await Database.addStreakMessage(this.userId, messageContent, this.discordInteraction.createdTimestamp);
		if (oneDayAfterAnother(lastTimestamp, currentTimestamp)) {
			await this.increment();
			return 'continueStreak';
		} else if (sameDay(lastTimestamp, currentTimestamp)) {
			return 'sameDay';
		} else {
			return 'newStreak';
		}
	}

	async increment() {
		await Database.incrementStreakCounter(this.userId);
	}

	async reset() {
		await Database.setStreakCounter(this.userId, 0, this.username);
	}

	async init() {
		const result = await Database.getStreakCounter(this.userId);
		if (!result) {
			await Streak.reset();
		}
	}

	async revive() {
		await Database.reviveStreak(this.userId);
	}

	static async reviveAll() {
		const allUserIds = await Database.getAllUserIds();
		const bulkUpdateRows = [];
		for (const userId of allUserIds) {
			bulkUpdateRows.push({ userId: userId, awaitingRevive: true });
		}
		await Database.bulkUpdateStreakCounters(bulkUpdateRows);
	}


}

module.exports = Streak;