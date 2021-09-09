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
	execute: (interaction:Discord.CommandInteraction, args) => {
		// Command requires that the user has no roles
		const name = args.get('full-name').value;

		new DatabaseAccessor(config.databaseLocation).querySQL(`SELECT * FROM Students WHERE fullName='${name}'`)
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
			const roles = interaction.guild.roles.cache.filter(r => r.name === entry.role);

			await (interaction.member as Discord.GuildMember).edit({
				roles: roles,
				nick: fullName
			});

			await new DatabaseAccessor(config.databaseLocation).execSQL(`UPDATE Students SET discordID=${uID} where registerID=${registerID}`);

			interactionReply(interaction, `Welcome ${fullName}!`, true);
		}).catch(err => {
			console.log(err);
		});
	}
}

module.exports = {
	command
};
