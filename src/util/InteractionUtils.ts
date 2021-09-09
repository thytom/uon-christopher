// Contains functions that make handling interactions easier.
import * as Discord from 'discord.js'

/** Gives a nicer format for replying to interactions */
export function interactionReply(interaction : Discord.CommandInteraction, text : string, ephemeral :boolean): void {
	interaction.reply({
		content : text,
		ephemeral : ephemeral
	});
}
