const Sequelize = require('sequelize');

module.exports = {
	name: 'streak_counters',
	schema: {
		username: {
			type: Sequelize.STRING,
			unique: true,
			allowNull: true,
		},
		userId: {
			type: Sequelize.STRING,
			unique: true,
			allowNull: false,
		},
		numberOfDays: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
		},
		awaitingRevive: {
			type: Sequelize.BOOLEAN,
			defaultValue: false,
		},
	},
};