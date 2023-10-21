const fs = require('node:fs');
const path = require('node:path');

const { Client, Collection, GatewayIntentBits } = require('discord.js');
const cron = require('cron');

const Database = require('./database/database');
const Streak = require('./utils/Streak');
const LoggerFactory = require('./utils/logger');
const { timeZone, token } = require('../config.json');

const logger = LoggerFactory.getLogger(path.basename(__filename));

// Create a new client instance
const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildMessageReactions,
	GatewayIntentBits.MessageContent,
] });

// Load database
Database.sync();

// Load commands
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands', 'slash');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Load database updater daily as a cron job
cron.schedule('0 0 * * *', () => {
	logger.info(`Starting cron job. Current datetime is ${new Date().toISOString}`);
	Streak.updateDeadStreakCounters();
});


const job = new cron.CronJob('00 00 00 * * *',
	function() {
		logger.info(`Starting cron job. Current datetime is ${new Date().toISOString}`);
		Streak.updateDeadStreakCounters();
	},
	null,
	true,
	timeZone,
);

// Log in to Discord with your client's token
client.login(token);
