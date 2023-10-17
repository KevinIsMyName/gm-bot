const Sequelize = require('sequelize');

module.exports = {
	name: 'admins',
	schema: {
		name: {
			type: Sequelize.STRING,
			unique: true,
		},
		uid: {
			type: Sequelize.INTEGER,
			unique: true,
			allowNull: false,
		},
		addedBy: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
		},
	},
};