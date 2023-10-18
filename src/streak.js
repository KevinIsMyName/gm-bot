const Database = require('./database/connection');

class Streak {
	constructor(userId) {
		this.userId = userId;
		this.counter = null;
		this.lastTimestamp = null;
		this.awaitingRevive = null;
	}

	increment() {
		// Update user's streak counter
		// Add message to streak messages table
	}

	reset() {
		this.alive = true;
		this.counter = 1;
		// Add streak message if needed
		// Update user's streak counter
	}

	async init() {
		const result = await Database.getStreakCounter(this.userId);
		if (result) {
			this.counter = result.numberOfDays;
			this.awaitingRevive = result.awaitingRevive;
		} else {
			this.counter = 0;
			this.awaitingRevive = false;
		}
		this.lastTimestamp = await Database.getStreakLastTimestamp(this.userId);
	}

	async revive() {
		await Database.reviveStreak(this.userId);
	}
}

module.exports = Streak;