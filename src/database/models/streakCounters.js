const Sequelize = require('sequelize');

module.exports = {
	name: 'streak_counters',
	schema: {
		username: {
			type: Sequelize.STRING,
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
			allowNull: false,
		},
		awaitingRevive: {
			type: Sequelize.BOOLEAN,
			defaultValue: false,
		},
		reviveNumberOfDays: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
		},
	},
};