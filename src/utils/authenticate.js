const { adminRoleName } = require('../../config.json');

function isAdmin(guildMember) {
	if (!adminRoleName) return true;
	return guildMember.roles.cache.some(role => role.name === adminRoleName);
}

module.exports.isAdmin = isAdmin;