import * as Discord from 'discord.js'
import type {Command} from '../app'
import {setupDatabase} from '../util/RegisterDatabase'
import {DatabaseAccessor} from '../util/DatabaseAccessor'

import config from '../../config/config.json'
import {interactionReply} from '../util/InteractionUtils'

const command : Command = {
	disable:false,
	name:'query',
	description:'Look up a student in the database.',
	options: [
		{
			name:'id',
			description:'Look up a student based on discord account.',
			type:'SUB_COMMAND',
			options: [
				{
					name: 'user',
					description:'The user to look up',
					type: 'USER',
					required:true
				}
			]
		},
		{
			name:'name',
			description:'Look up students that match the full or partial name given.',
			type:'SUB_COMMAND',
			options: [
				{
					name:'name',
					description:'The name to query',
					type:'STRING',
					required:true
				}
			]

		}
	],
	initHooks: [
		setupDatabase,
	],
	defaultPermission:false,
	permissions:['Mentor', 'admin'],
	lockToChannels:['mentor-room'],
	execute: (interaction, args) => {
		const sc = args.getSubcommand();
		var sqlQuery = "";
		switch(sc) {
			case 'id': 
				const user : Discord.User = args.getUser('user');
				sqlQuery = `discordID = '${user.id}'`;
				break;
			case 'name': 
				const name : string = args.getString('name');
				sqlQuery = `fullName LIKE '%${name}%'`;
				break;
		}

		const fullQuery = `SELECT * FROM Students where ${sqlQuery}`;

		new DatabaseAccessor(config.databaseLocation).querySQL(fullQuery)
		.then(async (result) => {
			const stringList : Discord.EmbedFieldData[] = result.map(r => {
				const present = !(r.discordID == null);
				return {
					name: `${r.fullName}${(present) ? ' (' + r.discordID + ')' : ''}`,
					value: `${(present) ? 'Present' : 'Not Present'}`
				} 
			});
			if(stringList.length > 0) {
				const response : Discord.MessageEmbed = new Discord.MessageEmbed()
				.setTitle("Query Results")
				.setFields(stringList);
				interaction.reply(new Discord.MessagePayload(interaction, {
					content: `${interaction.member.user.username} made request \`${fullQuery}\``,
					embeds: [ response ],
				}))
			} else {
				interactionReply(interaction, `No results found for query \`${fullQuery}\``, false);
			}
		}).catch(err => {
			interactionReply(interaction, "Sorry, something went wrong.", true);
			console.log(err);
		})
	}
}


module.exports = {
	command
};
