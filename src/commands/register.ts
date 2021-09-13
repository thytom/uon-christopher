import 'discord.js'
import type {Command} from '../app'
import {setupDatabase} from '../util/RegisterDatabase'
import {DatabaseAccessor} from '../util/DatabaseAccessor'
import {interactionReply} from '../util/InteractionUtils'

import * as ConfigurationManager from '../util/ConfigurationManager'

import {CommandInteraction, GuildMember, Collection, Snowflake, Role} from 'discord.js'

const responses = {
	notfound: "Sorry, I can't find you on my list. Please double check your name or use @mentor for help.",
	insufficientperms: "Sorry, you don't have the permission to use this command."
}

const command : Command = {
	disable: false,
	name: 'register',
	description: 'Register yourself to the server.',
	options: [
		{
			name:'full-name',
			description:'Your full name, as the university would know it.',
			type: 'STRING',
			required: true
		}
	],
	initHooks: [
		setupDatabase,
	],
	defaultPermission: false,
	permissions:['limbo'],
	lockToChannels:['foyer'],
	execute: (interaction:CommandInteraction, args) => {
		// Command requires that the user has no roles
		const name = args.get('full-name').value;

		ConfigurationManager.fetch("databaseLocation")
		.then((dbLocation:string) => {
			return new DatabaseAccessor(dbLocation)
			.querySQL(`SELECT * FROM Students WHERE fullName='${name}'`)
		})
		.then((result:any[]) => { // Confirm that there's a valid entry
			const firstAvailableEntry = result.filter(r => r.discordID == null)[0];
			if(!firstAvailableEntry) {
				interactionReply(interaction, responses.notfound, true);
				throw new Error(`User ${interaction.member.user.username} attempted to register as ${name} but no valid entry found.`);
			} else {
				return firstAvailableEntry;
			}
		}).then(async function (entry) {
			const registerID = entry.registerID;
			const fullName = entry.fullName;
			const uID = interaction.member.user.id;
			const dbRoles = entry.roles.split(',');

			const roles = buildRoleList(interaction.guild.roles.cache, dbRoles);

			await (interaction.member as GuildMember).edit({
				roles: roles,
				nick: fullName
			});

			await new DatabaseAccessor(await ConfigurationManager.fetch("databaseLocation"))
			.execSQL(`UPDATE Students SET discordID=${uID} where registerID=${registerID}`);

			interactionReply(interaction, `Welcome ${fullName}!`, true);
		}).catch(err => {
			console.log(err);
		});
	}
}

function buildRoleList(guildRoles:Collection<Snowflake, Role>, dbRoles : string) : Collection<Snowflake, Role>{
	const dbRolesArr = dbRoles.split('|');

	const rolesToAddToUser = guildRoles.filter(role => dbRolesArr.includes(role.name));

	// Report any roles that aren't in the list
	const diff = dbRolesArr.filter(dbRoleArrRole => rolesToAddToUser.find(rolesToAddToUser => {
		return dbRoleArrRole != rolesToAddToUser.name;
	}));

	if(diff.length > 0) {
		console.log("Unable to add roles " + diff + " as they do not exist.");
	}

	return rolesToAddToUser;
}

module.exports = {
	command
};
