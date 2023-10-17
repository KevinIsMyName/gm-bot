const Sequelize = require('sequelize');
const fs = require('node:fs');

const dbFile = 'database.sqlite';
// Create data dir if does not exist
!fs.existsSync('./data/') && fs.mkdirSync('./data/', { recursive: true });
// Create db file if does not exist
!fs.existsSync(`./data/${dbFile}`) && fs.open(`./data/${dbFile}`, 'w', () => {return undefined;});

// Connect to database
const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: './data/database.sqlite', // SQLite only
});

console.log('Connected to database!');

module.exports = sequelize;