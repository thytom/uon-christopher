import * as Discord from 'discord.js'
import type {Command} from '../app'
import {setupDatabase} from '../util/RegisterDatabase'
import {DatabaseAccessor} from '../util/DatabaseAccessor'

import config from '../../config/config.json'

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
	execute: (interaction, args) => {
		// Command requires that the user has no roles
		if(hasNoRoles(interaction.member)) {
			const name = args.get('name').value;
			var registerID = null;
			var uID = null;

			DatabaseAccessor.awaitConnection(config.databaseLocation)
			.then(db => {
				const val = db.querySQL(`SELECT * FROM Students WHERE fullName='${name}'`);
				db.close();
				return val;
			}).then(result => {
				if(result[0]){
					registerID = result[0].registerID;
					uID = interaction.member.id;
					interaction.reply({
						content:`Welcome, ${name}!`,
						ephemeral:true
					});
					return DatabaseAccessor.awaitConnection(config.databaseLocation);
				} else {
					interaction.reply({
						content:"Sorry, I can't find you on my list. Please double check your name or use @mentor for help.",
						ephemeral:true
					});
					throw new Error("User not found.");
				}
			}).then(db => {
				db.execSQL(`UPDATE Students SET discordID=${uID} where registerID=${registerID}`);
				db.close();
			}).catch(err => {
				console.log(err);
			});
		} else {
			// Respond saying they don't have permissions to use this
			interaction.reply({
				content:"Sorry, you don't have the permission to use this command.",
				ephemeral:true
			});
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
