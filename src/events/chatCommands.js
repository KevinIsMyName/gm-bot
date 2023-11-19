const fs = require('node:fs');
const path = require('node:path');

const { Events } = require('discord.js');

const Database = require('../database/database');
const LoggerFactory = require('../utils/logger');
const Streak = require('../utils/streak');
const { channelIds, prefix, regexArgs } = require('../../config.json');

const logger = LoggerFactory.getLogger(path.basename(__filename));

function getChatCommands() {
	const folderPath = path.join(__dirname, '..', 'commands', 'chat');
	const chatCommandConfigs = {};
	const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(folderPath, file);
		const commandConfig = require(filePath);
		if ('keyword' in commandConfig && 'handler' in commandConfig) {
			chatCommandConfigs[commandConfig.keyword] = {
				description: commandConfig.description || null,
				handler: commandConfig.handler,
			};
			logger.info(`Successfully got chat command (${commandConfig.keyword}) for ${filePath}`);
		} else {
			logger.warn(`The chat command at ${filePath} is missing a required "keyword" or "handler" property.`);
		}
	}
	return chatCommandConfigs;
}

module.exports = {
	name: Events.MessageCreate,
	async execute(interaction) {
		// Only listen to a specific channel
		if (!channelIds.includes(interaction.channelId)) return;

		// Ignore reading bot's own messages
		if (interaction.author.id === interaction.client.user.id) return;

		// Process streak messages messages
		const messageContent = interaction.content;
		for (const args of regexArgs) {
			const [ re, mode ] = args;
			const pattern = new RegExp(re, mode);
			if (messageContent.match(pattern)) {
				logger.info(`Processing ${interaction.author.username}'s message: ${messageContent}`)
				const streak = new Streak(interaction);
				const status = await streak.processMessage();
				let emoji = null;
				switch (status) {
					case 'continueStreak':
						emoji = '☀';
						break;
					case 'sameDay':
						emoji = '😴';
						break;
					case 'newStreak':
						emoji = '🌞';
						break;
					default:
						emoji = '❓';
						break;
				}
				logger.debug(`Reacting to ${messageContent} with ${emoji}`);
				interaction.react(emoji);
				return;
			}
		}

		// Ignore messages that are not prefixed
		if (messageContent.length < prefix.length && messageContent.substring(0, prefix.length) != prefix) return;

		const command = messageContent.substring(prefix.length, messageContent.length);
		const chatCommands = getChatCommands();

		if (chatCommands[command]) await chatCommands[command].handler(interaction);
	},
};

module.exports.getChatCommands = getChatCommands;