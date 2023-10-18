const Database = require('./database/connection');

class Streak {
	constructor(discordInteraction) {
		this.discordInteraction = discordInteraction;
		this.username = discordInteraction.user.username;
		this.userId = discordInteraction.content.user.id;
	}

	async increment(discordInteraction) {
		if (this.userId != discordInteraction.author.id) throw new Error('Attempted to increment with a different user\'s message');

		await Database.incrementStreakCounter(this.userId);
		await Database.addStreakMessage(this.userId, discordInteraction.content, discordInteraction.createdTimestamp);
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
}

module.exports = Streak;