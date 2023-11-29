const path = require('node:path');

const messageCreate = require('../../events/messageCreate');
const LoggerFactory = require('../../utils/logger');
const { prefix } = require('../../../config.json');

const logger = LoggerFactory.getLogger(path.basename(__filename));

module.exports = {
	'keyword': 'help',
	'description': 'Show all available chat commands',
	'handler': async function(interaction) {
		let replyMessageContent = '';
		const commands = messageCreate.getChatCommands();
		for (const commandKeyword in commands) {
			if (!commands[commandKeyword].description) continue; // Ignore commands with no description
			replyMessageContent += `\`${prefix}${commandKeyword}\`: ${commands[commandKeyword].description}\n`;
		}
		logger.debug(replyMessageContent);
		await interaction.reply(replyMessageContent);
		logger.info('Successfully displayed help');
	},
};
