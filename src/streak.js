const Database = require('./database/connection');

class Streak {
	constructor(discordInteraction) {
		this.discordInteraction = discordInteraction;
		this.username = discordInteraction.author.username;
		this.userId = discordInteraction.author.id;
	}

	async processMessage() {
		const lastTimestamp = await Database.getLastTimestamp(this.userId);
		const currentTimestamp = this.discordInteraction.createdTimestamp;
		if (this.timestampsWithinOneDay(lastTimestamp, currentTimestamp)) {
			return;
		}
	}

	async increment() {
		await Database.incrementStreakCounter(this.userId);
		await Database.addStreakMessage(this.userId, this.discordInteraction.content, this.discordInteraction.createdTimestamp);
	}

	async reset() {
		const args = {
			username: this.username,
			userId: this.userId,
			numberOfDays: 0,
		};
		await Database.setStreakCounter(args);
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

	timestampsWithinOneDay(timestamp1, timestamp2) {
		return;
	}
}

module.exports = Streak;