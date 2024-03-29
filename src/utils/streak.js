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
	const differenceInMillisecs = Math.abs(date1.getTime() - date2.getTime());
	const result = (ONE_DAY_IN_SECONDS * 1000) <= differenceInMillisecs && differenceInMillisecs < (2 * ONE_DAY_IN_SECONDS * 1000);
	logger.debug(`${date1} (${unixTimestamp1}) and ${date2} (${unixTimestamp2}) are ${result ? 'not ' : ''}one day after another`);
	return result;
}

function sameDate(unixTimestamp1, unixTimestamp2) {
	const result = unixTimestampToDate(unixTimestamp1).toDateString() == unixTimestampToDate(unixTimestamp2).toDateString();
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
		logger.debug(`Received message of ${messageContent} from ${this.userId} at ${createdTimestamp}`);

		const lastTimestamp = await Database.getLastTimestamp(this.userId);
		const streakCounter = await Database.getStreakCounter(this.userId);

		if (this.username !== streakCounter.username) {
			logger.info(`Found new name ${this.username} for ${streakCounter.username}`);
			this.refreshUsername(streakCounter);
		}

		await Database.addStreakMessage(this.userId, messageContent, this.discordInteraction.createdTimestamp);
		if (!streakCounter) {
			logger.info(`Streak does not exist and is now starting at 1 for ${this.username}`);
			this.resetStreak(1);
			return 'newStreak';
		} else if (oneDayAfterAnother(lastTimestamp, createdTimestamp)) {
			await this.continue();
			logger.info(`Streak continues for ${this.username}`);
			return 'continueStreak';
		} else if (sameDate(lastTimestamp, createdTimestamp)) {
			logger.info(`Duplicate streak message for ${this.username}`);
			return 'sameDay';
		} else if (streakCounter.awaitingRevive) {
			await this.useRevive();
			await this.continue();
			logger.info(`Streak for ${this.username} used a revive`);
			return 'reviveStreak';
		} else if (streakCounter.numberOfDays === 0) {
			logger.info(`Streak was broken and is now starting at 1 for ${this.username}`);
			this.resetStreak(1);
			return 'newStreak';
		} else {
			logger.error(`Unexpected condition, don't know how to process message ${messageContent} from ${this.userId} at ${createdTimestamp}.`);
			return null;
		}
	}

	async useRevive() {
		await Database.setNumberOfDaysToReviveNumberOfDays(this.userId);
		await this.disableRevive();
		logger.debug(`Streak for ${this.username} is now revived`);
	}

	async enableRevive() {
		await Database.setStreakCountersRevive(this.userId, true, { username: this.username });
		logger.debug(`Streak for ${this.username} is awaiting revive`);
	}

	async disableRevive() {
		await Database.setStreakCountersRevive(this.userId, false, { username: this.username });
		logger.debug(`Streak for ${this.username} is not awaiting revive`);
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

	async refreshUsername(streakCounter) {
		await Database.setStreakCounter(this.userId, streakCounter.numberOfDays, { username: this.username });
		logger.info(`Successfully refreshed username for ${streakCounter.username} to ${this.username}`);
	}

	static async refreshAliveStreaks() {
		logger.info('Looking for dead streaks');
		const currentTime = new Date().getTime();

		const streakCounterRows = await Database.getAllAliveStreakCounters();
		const updatedStreakCounters = [];
		for (const row of streakCounterRows) {
			if (row.numberOfDays === 0) {
				continue;
			}
			const userId = row.userId;
			const lastTimestamp = await Database.getLastTimestamp(userId);
			if (oneDayAfterAnother(currentTime, lastTimestamp) || sameDate(currentTime, lastTimestamp)) {
				logger.debug(`${row.username}'s streak is healthy at ${row.numberOfDays}, should not be reset.`);
			} else {
				logger.info(`${row.username}'s streak broke, resetting to 0.`);
				logger.debug(`${currentTime} and ${lastTimestamp} means the streak broke.`);
				updatedStreakCounters.push({ numberOfDays: 0, userId: row.userId, reviveNumberOfDays: row.numberOfDays });
			}
		}
		if (updatedStreakCounters.length !== 0) await Database.bulkUpdateStreakCounters(updatedStreakCounters);
		logger.info(`Finished refreshing all alive streaks of ${JSON.stringify(updatedStreakCounters)}`);
	}
}

module.exports = Streak;