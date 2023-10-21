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

		// Handle revives
		const streakCounter = await Database.getStreakCounter(this.userId);
		if (streakCounter && streakCounter.awaitingRevive && (streakCounter.numberOfDays === 0)) {
			await this.useRevive();
			await this.increment();
			logger.info(`Streak for ${this.username} used a revive`);
			return 'continueStreak';
		}

		// Handle new streaks
		const lastTimestamp = await Database.getLastTimestamp(this.userId);
		if (!lastTimestamp) {
			logger.info(`Message started a brand new streak for ${this.username}`);
			this.resetStreak(1);
			return 'newStreak';
		}

		await Database.addStreakMessage(this.userId, messageContent, this.discordInteraction.createdTimestamp);
		if (oneDayAfterAnother(lastTimestamp, createdTimestamp)) {
			await this.continue();
			logger.info(`Streak continues for ${this.username}`);
			return 'continueStreak';
		} else if (sameDate(lastTimestamp, createdTimestamp)) {
			logger.info(`Duplicate streak message for ${this.username}`);
			return 'sameDay';
		} else {
			logger.info(`Streak was broken and is now starting at 1 for ${this.username}`);
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

		const streakCounters = await Database.getAllAliveStreakCounters();
		const updatedStreakCounters = [];
		streakCounters.forEach(async (streakRow) => {
			const userId = streakRow.userId;
			const lastTimestamp = await Database.getLastTimestamp(userId);
			if (oneDayAfterAnother(currentTime, lastTimestamp) || sameDate(currentTime, lastTimestamp)) {
				logger.info(`${streakRow.username}'s streak is healthy at ${streakRow.numberOfDays}, should not be reset.`);
			} else {
				logger.info(`${streakRow.username}'s streak broke, resetting to 0.`);
				updatedStreakCounters.push({ numberOfDays: 0, userId: streakRow.userId, reviveNumberOfDays: streakRow.numberOfDays });
			}
		});
		if (updatedStreakCounters) Database.bulkUpdateStreakCounters(updatedStreakCounters);
		logger.info('Finished updating all dead streaks');
	}
}

module.exports = Streak;