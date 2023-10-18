const Sequelize = require('sequelize');

module.exports = {
	name: 'streak_messages',
	schema: {
		userId: {
			type: Sequelize.STRING,
			allowNull: false,
		},
		messageContent: {
			type: Sequelize.TEXT,
		},
		timestamp: {
			type: Sequelize.TIME,
			allowNull: false,
		},
	},
};