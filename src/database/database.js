const fs = require('node:fs');
const path = require('node:path');

const Sequelize = require('sequelize');
const { utcToZonedTime } = require('date-fns-tz');

const LoggerFactory = require('../utils/logger');
const { timeZone } = require('../../config.json');

const logger = LoggerFactory.getLogger(path.basename(__filename));

class Database {
	static #filename = 'database.sqlite';
	static #connection = null;

	static connect() {
		// Create data dir if does not exist
		!fs.existsSync('./data/') && fs.mkdirSync('./data/', { recursive: true });
		// Create db file if does not exist
		!fs.existsSync(`./data/${Database.#filename}`) && fs.open(`./data/${Database.#filename}`, 'w', (err, fd) => {
			if (err) logger.error(err);
			fs.close(fd);
		});

		Database.#connection = new Sequelize('database', 'user', 'password', {
			host: 'localhost',
			dialect: 'sqlite',
			logging: false,
			storage: './data/' + Database.#filename,
			pool: {
				max: 5,
				min: 0,
				acquire: 30000,
				idle: 10000,
			},
		});
		logger.info('Connected to database!');
	}

	static get connection() {
		if (Database.#connection === null) {
			Database.connect();
		}
		return Database.#connection;
	}

	static async sync() {
		const modelsPath = path.join(__dirname, 'models');
		const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));

		this.schemas = {};
		for (const file of modelFiles) {
			const filePath = path.join(modelsPath, file);
			const { name, schema } = require(filePath);
			const model = Database.connection.define(name, schema);
			this.schemas[name] = model;
			logger.debug(`Synced ${file}`);
		}
		Database.connection.sync({ alter: true });
		logger.info('Updated database schemas!');
	}

	static async backup() {
		// Create data dir if does not exist
		!fs.existsSync('./data/backup') && fs.mkdirSync('./data/backup', { recursive: true });

		// Create backup database file
		const backupFilePath = './data/backup/' + utcToZonedTime(new Date(), timeZone).toISOString();
		logger.debug(`Beginning backup to ${backupFilePath}`);
		try {
			fs.copyFileSync('./data/' + Database.#filename, backupFilePath, fs.constants.COPYFILE_EXCL);
		} catch (error) {
			logger.error('Error when copying database to backup: ' + error);
		}
	}

	static getStreakCountersTable() {
		return this.schemas['streak_counters'];
	}

	static getStreakMessagesTable() {
		return this.schemas['streak_messages'];
	}

	static async setStreakCounter(userId, numberOfDays, opts) {
		const Counters = Database.getStreakCountersTable();
		try {
			if (await Database.getStreakCounter(userId)) {
				logger.debug(`Streak counter exists for ${Counters.name}.userId=${userId}`);
				if (opts['username']) {
					await Counters.update(
						{
							username: opts['username'],
							numberOfDays: numberOfDays,
						},
						{ where: { userId: userId } });
					logger.info(`Successfully updated ${Counters.name}.username=${opts['username']} and ${Counters.name}.numberOfDays=${numberOfDays} for userId=${userId}`);
				} else {
					await Counters.update(
						{ numberOfDays: numberOfDays },
						{ where: { userId: userId } });
					logger.info(`Successfully updated ${Counters.name}.numberOfDays=${numberOfDays} for userId=${userId}`);
				}
			} else {
				logger.warn(`Streak counter does not exist for ${Counters.name}.userId=${userId}`);
				const newRow = {
					username: opts['username'] || null,
					userId: userId,
					numberOfDays: numberOfDays,
				};
				await Counters.create(newRow);
				logger.info(`Successfully created ${Counters.name} with new row ${JSON.stringify(newRow)}`);
			}
		} catch (err) {
			const errorMessageContent = `Something went wrong when setting ${Counters.name}.numberOfDays=${numberOfDays} for ${userId}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async getStreakCounter(userId) {
		const Counters = Database.getStreakCountersTable();
		try {
			const result = await Counters.findOne({ where: { userId: userId } });
			logger.info(`Successfully got ${Counters.name}.userId=${userId}`);
			logger.debug(`Successfully got ${Counters.name}.userId=${userId} with result ${JSON.stringify(result)}`);
			return result;
		} catch (err) {
			const errorMessageContent = `Something went wrong when getting ${Counters.name}.userId=${userId}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async getAllAliveStreakCounters() {
		const Counters = Database.getStreakCountersTable();
		try {
			const results = await Counters.findAll({
				where: {
					[Sequelize.Op.or]: [
						{ numberOfDays: { [Sequelize.Op.gt]: 0 } },
						{ awaitingRevive: true },
					],
				},
				order: [
					['numberOfDays', 'DESC'],
					['updatedAt', 'ASC']],
			});
			logger.info(`Successully got all alive ${Counters.name}`);
			return results;
		} catch (err) {
			const errorMessageContent = `Something went wrong when getting all alive ${Counters.name}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async getAllDeadStreakCounters() {
		const Counters = Database.getStreakCountersTable();
		try {
			const results = await Counters.findAll({
				where: {
					[Sequelize.Op.and]: [
						{ numberOfDays: 0 },
						{ awaitingRevive: false },
					],
				},
				order: [
					['updatedAt', 'ASC'],
					['reviveNumberOfDays', 'DESC']],
			});
			logger.info(`Successully got all dead ${Counters.name}`);
			return results;
		} catch (err) {
			const errorMessageContent = `Something went wrong when getting all dead ${Counters.name}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async incrementStreakCounter(userId) {
		const Counters = Database.getStreakCountersTable();
		try {
			await Counters.increment({ numberOfDays: 1 }, { where: { userId: userId } });
			logger.info(`Successfully incremented numberOfDays by 1 for ${Counters.name}.userId=${userId}`);
		} catch (err) {
			const errorMessageContent = `Something went wrong when incrementing ${Counters.name}.userId=${userId}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async bulkUpdateStreakCounters(rows) {
		const Counters = Database.getStreakCountersTable();
		try {
			const results = await Counters.bulkCreate(rows, { updateOnDuplicate: ['userId', 'numberOfDays', 'reviveNumberOfDays'], validate: true });
			logger.info(`Successfully bulk-created/updated ${Counters.name} with rows ${JSON.stringify(rows)}`);
			return results;
		} catch (err) {
			const errorMessageContent = `Something went wrong when updating ${Counters.name} with ${JSON.stringify(rows)}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async setStreakCountersRevive(userId, reviveBool, opts) {
		const Counters = Database.getStreakCountersTable();
		try {
			if (await Database.getStreakCounter(userId)) {
				logger.debug(`Streak counter does exist for ${Counters.name}.userId=${userId}`);
				await Counters.update(
					{ awaitingRevive: reviveBool },
					{ where: { userId: userId } });
				logger.info(`Successfully set ${Counters.name}.awaiting_revive=${reviveBool} for ${Counters.name}.userId=${userId}`);
			} else {
				logger.info(`No existing streak counter for ${Counters.name}.userId=${userId}`);
				await Database.setStreakCounter(userId, 0, { username: opts['username'] || null });
				logger.info(`Initialized streak counter to 0 for ${Counters.name}.userId=${userId}`);
			}
		} catch (err) {
			const errorMessageContent = `Something went wrong with reviving ${Counters.name}.userId=${userId}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async setAllStreakCountersRevive(bool) {
		const Counters = Database.getStreakCountersTable();
		try {
			await Counters.update({ awaitingRevive: bool }, { where : {} }); // update() requires a where clause
			logger.info('Successfully revived all streak counters');
		} catch (err) {
			const errorMessageContent = `Something went wrong with reviving all ${Counters.name}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async setReviveNumberOfDays(userId, reviveNumberOfDays) {
		const Counters = Database.getStreakCountersTable();
		try {
			await Counters.update(
				{ reviveNumberOfDays: reviveNumberOfDays },
				{ where : { userId: userId } });
			logger.info(`Successfully set reviveNumberOfDays to ${reviveNumberOfDays} ${Counters.name}.userId=${userId}`);
		} catch (err) {
			const errorMessageContent = `Something went wrong with reviving all ${Counters.name}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async setNumberOfDaysToReviveNumberOfDays(userId) {
		const Counters = Database.getStreakCountersTable();
		try {
			await Counters.update(
				{ numberOfDays: Sequelize.col('reviveNumberOfDays') },
				{ where : { userId: userId } });
			logger.info(`Successfully copied numberOfDays to reviveNumberOfDays for ${Counters.name}.userId=${userId}`);
		} catch (err) {
			const errorMessageContent = `Something went wrong when copying numberOfDays to reviveNumberOfDays for ${Counters.name}.userId=${userId}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async setReviveNumberOfDaysToNumberOfDays(userId) {
		const Counters = Database.getStreakCountersTable();
		try {
			await Counters.update(
				{ reviveNumberOfDays: Sequelize.col('numberOfDays') },
				{ where : { userId: userId } });
			logger.info(`Successfully copied reviveNumberOfDays to numberOfDays for ${Counters.name}.userId=${userId}`);
		} catch (err) {
			const errorMessageContent = `Something went wrong with reviving all ${Counters.name}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async addStreakMessage(userId, messageContent, createdTimestamp) {
		const Messages = Database.getStreakMessagesTable();
		const row = {
			userId: userId,
			messageContent: messageContent,
			timestamp: createdTimestamp,
		};
		try {
			await Messages.create(row);
			logger.info(`Successfully added message ${messageContent} for userId=${userId}`);
		} catch (err) {
			const errorMessageContent = `Something went wrong when adding to ${Messages.name} ${row}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async getLastTimestamp(userId) {
		const Messages = Database.getStreakMessagesTable();
		try {
			const result = await Messages.findOne(
				{
					where: { userId: userId },
					order: [['timestamp', 'DESC']],
				},
			);
			logger.info(`Successfully got latest message's timestamp of ${result.timestamp} for userId=${userId}`);
			return result.timestamp;
		} catch (err) {
			const errorMessageContent = `Something went wrong when getting ${Messages.name}.userId=${userId}`;
			logger.error(errorMessageContent);
			logger.error(err);
			throw Error(errorMessageContent);
		}
	}

	static async close() {
		if (Database.#connection === null) {
			await Database.#connection.close();
			logger.info('Connection closed');
		} else {
			logger.warn('Connection is already closed');
		}
	}
}

module.exports = Database;