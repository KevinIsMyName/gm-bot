const path = require('node:path');

const Database = require('../database/database');
const { fromUnixTime } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');

const LoggerFactory = require('./logger');
const { timeZone } = require('../../config.json');

const logger = LoggerFactory.getLogger(path.basename(__filename));
const ONE_DAY_IN_SECONDS = 86400;

function unixTimestampToDate(unixTimestamp) {
	const result = new Date(utcToZonedTime(fromUnixTime(unixTimestamp / 1000), timeZone).toDateString()); // Hacky way to truncate time
	logger.debug(`${unixTimestamp} converted to ${result}`);
	return result;
}

function oneDayAfterAnother(unixTimestamp1, unixTimestamp2) {
	const date1 = unixTimestampToDate(unixTimestamp1);
	const date2 = unixTimestampToDate(unixTimestamp2);
	const result = Math.abs(date1.getTime() - date2.getTime()) === (ONE_DAY_IN_SECONDS * 1000);
	logger.debug(`${date1} (${unixTimestamp1}) and ${date2} (${unixTimestamp2}) are ${result ? 'not ' : ''}one day after another`);
	return result;
}

function sameDate(unixTimestamp1, unixTimestamp2) {
	const result = unixTimestampToDate(unixTimestamp1).getTime() == unixTimestampToDate(unixTimestamp2).getTime();
	logger.debug(`${unixTimestamp1} and ${unixTimestamp2} are ${result ? 'not ' : ''}same date`);
	return result;
}

class Streak {
	constructor(discordInteraction) {
		this.discordInteraction = discordInteraction;
		this.username = discordInteraction.author.username;
		this.userId = discordInteraction.author.id;
	}

	async processMessage() {
		const messageContent = this.discordInteraction.content;
		const createdTimestamp = this.discordInteraction.createdTimestamp;
		logger.debug(`Received message of ${messageContent} from ${this.userIid} at ${createdTimestamp}`);

		// Handle new streaks
		const lastTimestamp = await Database.getLastTimestamp(this.userId);
		const streakCounter = await Database.getStreakCounter(this.userId);

		await Database.addStreakMessage(this.userId, messageContent, this.discordInteraction.createdTimestamp);
		if (streakCounter.numberOfDays === 0) {
			logger.info(`Streak was broken and is now starting at 1 for ${this.username}`);
			this.resetStreak(1);
		} else if (oneDayAfterAnother(lastTimestamp, createdTimestamp)) {
			await this.continue();
			logger.info(`Streak continues for ${this.username}`);
			return 'continueStreak';
		} else if (sameDate(lastTimestamp, createdTimestamp)) {
			logger.info(`Duplicate streak message for ${this.username}`);
			return 'sameDay';
		} else if (streakCounter && streakCounter.awaitingRevive) {
			await this.useRevive();
			await this.increment();
			logger.info(`Streak for ${this.username} used a revive`);
			return 'continueStreak';
		} else {
			logger.error(`Unexpected condition, don't know how to process message ${messageContent} from ${this.userId} at ${createdTimestamp}.`);
			this.resetStreak(1);
			return 'newStreak';
		}
	}

	async increment() {
		await Database.incrementStreakCounter(this.userId);
		await Database.setReviveNumberOfDaysToNumberOfDays(this.userId);
		logger.debug(`Streak incremented for ${this.username}`);
	}

	async continue() {
		await Database.incrementStreakCounter(this.userId);
		await Database.setReviveNumberOfDaysToNumberOfDays(this.userId);
		await this.disableRevive(this.userId);
		logger.debug(`Streak continued for ${this.username}`);
	}

	async resetStreak(numberOfDays) {
		await Database.setStreakCounter(this.userId, numberOfDays, { username: this.username });
		await this.disableRevive();
		await Database.setReviveNumberOfDays(this.userId, numberOfDays);
		logger.debug(`Streak for ${this.username} reset back to ${numberOfDays}`);
	}

	static async isAlive(userId) {
		return await Database.getStreakCounter(userId).numberOfDays !== 0;
	}

	async useRevive() {
		await Database.setNumberOfDaysToReviveNumberOfDays(this.userId);
		await this.disableRevive();
		logger.debug(`Streak for ${this.username} is now revived`);
	}

	async enableRevive() {
		await Database.setStreakCounterRevive(this.userId, true, { username: this.username });
		logger.debug(`Streak for ${this.username} will awaiting revive`);
	}

	async disableRevive() {
		await Database.setStreakCounterRevive(this.userId, false, { username: this.username });
		logger.debug(`Streak for ${this.username} is no longer awaiting revive`);
	}

	static async updateDeadStreakCounters() {
		logger.info('Looking for dead streaks');
		// BUG: Might not be same timezone as Discord's timestamps
		const currentTime = new Date().getTime();

		const streakCounterRows = await Database.getAllAliveStreakCounters();
		const updatedStreakCounters = [];
		for (const row of streakCounterRows) {
			const userId = row.userId;
			const lastTimestamp = await Database.getLastTimestamp(userId);
			if (oneDayAfterAnother(currentTime, lastTimestamp) || sameDate(currentTime, lastTimestamp)) {
				console.debug(`${row.username}'s streak is healthy at ${row.numberOfDays}, should not be reset.`);
			} else {
				console.info(`${row.username}'s streak broke, resetting to 0.`);
				updatedStreakCounters.push({ numberOfDays: 0, userId: row.userId, reviveNumberOfDays: row.numberOfDays });
			}
		}
		if (updatedStreakCounters.length !== 0) await Database.bulkUpdateStreakCounters(updatedStreakCounters);
		logger.info(`Finished updating all dead streaks of ${JSON.stringify(updatedStreakCounters)}`);
	}
}

module.exports = Streak;