const Sequelize = require('sequelize');

module.exports = {
	name: 'admins',
	schema: {
		uid: {
			type: Sequelize.STRING,
			unique: true,
			allowNull: false,
		},
		addedBy: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
		},
	},
};