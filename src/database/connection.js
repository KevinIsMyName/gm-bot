const Sequelize = require('sequelize');
const fs = require('node:fs');
const path = require('node:path');

class Database {
	static #filename = 'database.sqlite';
	static #connection = null;

	static connect() {
		// Create data dir if does not exist
		!fs.existsSync('./data/') && fs.mkdirSync('./data/', { recursive: true });
		// Create db file if does not exist
		!fs.existsSync(`./data/${Database.#filename}`) && fs.open(`./data/${Database.#filename}`, 'w', () => { return undefined; });

		Database.#connection = new Sequelize('database', 'user', 'password', {
			host: 'localhost',
			dialect: 'sqlite',
			logging: false,
			storage: './data/database.sqlite', // SQLite only
			pool: {
				max: 5,
				min: 0,
				acquire: 30000,
				idle: 10000,
			},
		});

		console.log('Connected to database!');
	}

	static get connection() {
		if (Database.#connection === null) {
			Database.connect();
		}
		return Database.#connection;
	}

	static sync() {
		const modelsPath = path.join(__dirname, 'models');
		const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));

		this.schemas = {};
		for (const file of modelFiles) {
			const filePath = path.join(modelsPath, file);
			const { name, schema } = require(filePath);
			const model = Database.connection.define(name, schema);
			this.schemas[name] = model;
			console.debug(`Synced ${file}`);
		}
		Database.connection.sync({ alter: true });
		console.log('Updated database schemas!');
	}

	static getAdminTable() {
		return this.schemas['admins'];
	}

	static getStreakCounterTable() {
		return this.schemas['streak_counters'];
	}

	static getStreakMessagesTable() {
		return this.schemas['streak_messages'];
	}

	static async isAdmin(userId) {
		const Admins = Database.getAdminTable();
		const count = await Admins.count({
			where: {
				userId: userId,
			},
		});
		return count > 0;
	}

	static async addAdmin(args) {
		const Admins = Database.getAdminTable();
		try {
			await Admins.create({
				userId: args.newAdminUserId,
				addedBy: args.existingAdminUserId,
			});
			console.log(`Added ${args.newAdminUserId} to admin`);
		} catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				return Error('Admin already exists.');
			}
			return Error(`Something went wrong when adding admin.userId=${args.newAdminUserId}.`);
		}
	}

	static async removeAdmin(args) {
		const Admins = Database.getAdminTable();
		try {
			await Admins.destroy({
				userId: args.removeAdminUserId,
			});
			console.log(`Removed ${args.removeAdminUserId} from admin`);
		} catch (error) {
			return Error(`Something went wrong when removing admin.userId=${args.removeAdminUserId}.`);
		}
	}

	static async setStreakCounter(userId, numberOfDays, opts) {
		const Counters = Database.getStreakCounterTable();
		try {
			if (await Database.getStreakCounter(userId)) {
				if (opts['test']) {
					await Counters.update(
						{
							username: opts['test'],
							numberOfDays: numberOfDays,
						}, {
							where: {
								userId: userId,
							},
						});
				} else {
					await Counters.update(
						{
							numberOfDays: numberOfDays,
						}, {
							where: {
								userId: userId,
							},
						});
				}
			} else {
				await Counters.create({
					username: opts['test'] || null,
					userId: userId,
					numberOfDays: numberOfDays,
				});
			}
		} catch (error) {
			return Error(`Something went wrong when setting streak_counters for ${userId}.`);
		}
	}

	static async getStreakCounter(userId) {
		const Counters = Database.getStreakCounterTable();
		try {
			const results = await Counters.findOne({
				where: {
					userId: userId,
				},
			});
			return results;
		} catch (error) {
			return Error(`Something went wrong when getting streak_counters.userId=${userId}.`);
		}
	}

	static async getAllStreakCounters() {
		const Counters = Database.getStreakCounterTable();
		try {
			const results = await Counters.findAll({
				order: [
					['numberOfDays', 'DESC'],
				],
			});
			return results;
		} catch (error) {
			return Error('Something went wrong when getting all streak_counters');
		}
	}

	static async getStreakCounterByUserId(userId) {
		const Counters = Database.getStreakCounterTable();
		try {
			const result = await Counters.findOne({
				where: {
					userId: userId,
				},
			});
			return result;
		} catch (error) {
			return Error('Something went wrong when getting streak for');
		}
	}

	static async getAllAliveStreakCounters() {
		const Counters = Database.getStreakCounterTable();
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
				],
			});
			return results;
		} catch (error) {
			return Error('Something went wrong when getting all alive streak_counters');
		}
	}

	static async bulkUpdateStreakCounters(rows) {
		const Counters = Database.getStreakCounterTable();
		try {
			const results = await Counters.bulkCreate(rows, { updateOnDuplicate: ['userId'], validate: true });
			return results;
		} catch (error) {
			return Error(`Something went wrong when updating streak_counters with ${rows}.`);
		}
	}

	static async incrementStreakCounter(userId) {
		const Counters = Database.getStreakCounterTable();
		try {
			const results = await Counters.increment({
				where: {
					userId: userId,
				},
			});
			return results;
		} catch (error) {
			return Error(`Something went wrong when incrementing streak_counters.userId=${userId}.`);
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
		} catch (error) {
			return Error(`Something went wrong when adding to streak_messages ${row}.`);
		}
	}

	static async getLastTimestamp(userId) {
		const Messages = Database.getStreakMessagesTable();
		try {
			const result = await Messages.findOne(
				{
					where: {
						userId: userId,
					},
					order: [
						['timestamp', 'desc'],
					],
				},
			);
			return result.timestamp;
		} catch (error) {
			return Error(`Something went wrong when getting streak_messages.userId=${userId}.`);
		}
	}

	static async reviveStreak(userId) {
		const Counters = Database.getStreakCounterTable();
		try {
			if (await Database.getStreakCounter(userId)) {
				await Counters.update(
					{
						awaitingRevive: true,
					}, {
						where: {
							userId: userId,
						},
					});
			} else {
				await Database.setStreakCounter(userId, 0);
			}
		} catch (error) {
			return Error(`Something went wrong with resetting streak counter of userId=${userId}`);
		}
	}

	static async close() {
		if (Database.#connection === null) {
			await Database.#connection.close();
			console.log('Connection closed');
		} else {
			console.log('Connection is already closed');
		}
	}
}

module.exports = Database;