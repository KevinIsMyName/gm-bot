const chatCommands = require('../../events/chatCommands');
const { prefix } = require('../../../config.json');

module.exports = {
	'keyword': 'help',
	'description': 'Show all available chat commands',
	'handler': async function(interaction) {
		let replyMessageContent = '';
		const commands = chatCommands.getChatCommands();
		for (const commandKeyword in commands) {
			if (!commands[commandKeyword].description) continue; // Ignore commands with no description
			replyMessageContent += `\`${prefix}${commandKeyword}\`: ${commands[commandKeyword].description}\n`;
		}
		await interaction.reply(replyMessageContent);
	},
};
