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

		for (const file of modelFiles) {
			const filePath = path.join(modelsPath, file);
			const { name, schema } = require(filePath);
			const model = Database.connection.define(name, schema);
			console.debug(`Synced ${file}`);
		}
		Database.connection.sync({ alter: true });
		console.log('Updated database schemas!');
	}

	static getAdminTable() {
		const { name, schema } = require(path.join(__dirname, 'models', 'admins'));
		const Admins = Database.connection.define(name, schema);
		return Admins;
	}

	static async isAdmin(userId) {
		const Admins = Database.getAdminTable();
		const count = await Admins.count({
			where: {
				userId: userId,
			},
		});
		return count > 0 ? true : false;
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
				return Error('That tag already exists.');
			}
			return Error(`Something went wrong with adding admin.userId=${args.newAdminUserId}.`);
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
			return Error(`Something went wrong with removing admin.userId=${args.removeAdminUserId}.`);
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