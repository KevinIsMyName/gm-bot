const Sequelize = require('sequelize');

module.exports = {
	name: 'streak_counters',
	schema: {
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