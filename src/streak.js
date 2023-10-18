const Database = require('./database/connection');

class Streak {

	constructor(userId) {
		this.userId = userId;
		this.counter = null;
		this.alive = false;
	}

	isAlive() {
		return this.alive;
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
		// Update streak counter
		const result = await Database.getStreakCounter(this.userId);
		this.counter = result;

		// Update streak alive status
		const lastStreakMessage = await Database.getLastStreakMessage(this.userId);
	}

	revive() {
		this.alive = true;
	}
}

module.exports = Streak;