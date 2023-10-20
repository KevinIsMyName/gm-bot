const Database = require('../database/connection');
const { fromUnixTime } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');
const { timeZone } = require('../../config.json');

const ONE_DAY_IN_SECONDS = 86400;

function unixTimestampToDate(unixTimestamp) {
	return new Date(utcToZonedTime(fromUnixTime(unixTimestamp / 1000), timeZone).toDateString()); // Hacky way to truncate time
}

function oneDayAfterAnother(unixTimestamp1, unixTimestamp2) {
	const date1 = unixTimestampToDate(unixTimestamp1);
	const date2 = unixTimestampToDate(unixTimestamp2);
	return Math.abs(date1.getTime() - date2.getTime()) === (ONE_DAY_IN_SECONDS * 1000);
}

function sameDate(unixTimestamp1, unixTimestamp2) {
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

		// Handle revives
		const awaitingRevive = await Database.getStreakCounter(this.userId);
		if (awaitingRevive) {
			await this.increment();
			await this.resetRevive();
		}

		// Handle new streaks
		const lastTimestamp = await Database.getLastTimestamp(this.userId);
		if (!lastTimestamp) {
			this.resetStreak(1);
			return 'newStreak';
		}

		const currentTimestamp = this.discordInteraction.createdTimestamp;
		await Database.addStreakMessage(this.userId, messageContent, this.discordInteraction.createdTimestamp);
		if (oneDayAfterAnother(lastTimestamp, currentTimestamp)) {
			await this.increment();
			return 'continueStreak';
		} else if (sameDate(lastTimestamp, currentTimestamp)) {
			return 'sameDay';
		} else {
			this.resetStreak(1);
			return 'newStreak';
		}
	}

	async increment() {
		await Database.incrementStreakCounter(this.userId);
	}

	async resetStreak(numberOfDays) {
		await Database.setStreakCounter(this.userId, numberOfDays, { username: this.username });
	}

	async resetRevive() {
		await Database.setStreakCounterRevive(false);
	}

	async init() {
		const result = await Database.getStreakCounter(this.userId);
		if (!result) {
			await this.resetStreak(0);
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

	static async updateDeadStreakCounters() {
		// BUG: Might not be same timezone as Discord's timestamps
		const currentTime = new Date().getTime();

		const streakCounters = await Database.getAllAliveStreakCounters();
		const updatedStreakCounters = [];
		streakCounters.forEach(async (streakRow) => {
			const userId = streakRow.userId;
			const lastTimestamp = await Database.getLastTimestamp(userId);
			if (oneDayAfterAnother(currentTime, lastTimestamp) || sameDate(currentTime, lastTimestamp)) {
				// Streak is healthy, should not be reset.
			} else {
				updatedStreakCounters.push({ userId: 0 });
			}
		});
		if (updatedStreakCounters) Database.bulkUpdateStreakCounters(updatedStreakCounters);
	}
}

module.exports = Streak;