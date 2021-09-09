import * as Discord from 'discord.js'
import type {Command} from '../app'
import {setupDatabase} from '../util/RegisterDatabase'
import {DatabaseAccessor} from '../util/DatabaseAccessor'
import {interactionReply} from '../util/InteractionUtils'

import config from '../../config/config.json'

const responses = {
	notfound: "Sorry, I can't find you on my list. Please double check your name or use @mentor for help.",
	insufficientperms: "Sorry, you don't have the permission to use this command."
}

const command : Command = {
	disable: false,
	name: 'register',
	description: 'Register yourself to the server.',
	initHooks: [
		setupDatabase,
	],
	options: [
		{
			name:'name',
			description:'Your full name, as the university would know it.',
			type: 'STRING',
			required: true
		}
	],
	execute: (interaction:Discord.CommandInteraction, args) => {
		// Command requires that the user has no roles
		if(hasNoRoles(interaction.member as Discord.GuildMember)) {
			const name = args.get('name').value;

			DatabaseAccessor.awaitConnection(config.databaseLocation)
			.then(db => { // Perform database query
				const result = db.querySQL(`SELECT * FROM Students WHERE fullName='${name}'`);
				db.close();
				return result;
			}).then(result => { // Confirm that there's a valid entry
				const firstAvailableEntry = result.filter(r => r.discordID == null)[0];
				if(!firstAvailableEntry) {
					interactionReply(interaction, responses.notfound, true);
					throw new Error(`User ${interaction.member.user.username} attempted to register as ${name} but no valid entry found.`);
				} else {
					return firstAvailableEntry;
				}
			}).then(async function (entry) {
				const db = await DatabaseAccessor.awaitConnection(config.databaseLocation);
				const registerID = entry.registerID;
				const fullName = entry.fullName;
				const uID = interaction.member.user.id;
				const roles = interaction.guild.roles.cache.filter(r => r.name === entry.role);

				await (interaction.member as Discord.GuildMember).edit({
					roles: roles,
					nick: fullName
				});

				await db.execSQL(`UPDATE Students SET discordID=${uID} where registerID=${registerID}`);
				db.close();

				interactionReply(interaction, `Welcome ${fullName}!`, true);
				interaction.deleteReply();
			}).catch(err => {
				console.log(err);
			});
		} else {
			// Respond saying they don't have permissions to use this
			interactionReply(interaction, responses.insufficientperms, true);
		}
	}
}

function hasNoRoles(user : Discord.GuildMember) : boolean {
	return (user.roles as Discord.GuildMemberRoleManager)
	.cache.map(r => r.name).length <= 1;
}

module.exports = {
	command
};
