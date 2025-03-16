const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const LogChannel = require('../../schemas/log'); // Import the LogChannel model
const axios = require('axios'); // Import axios for HTTP requests
require('dotenv').config(); // Load environment variables from .env file

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commands')
        .setDescription('All the commands for RDAF.')
        .toJSON(),
    
    userPermissions: [],
    botPermissions: [], // No special permissions are needed for this command
    run: async (client, interaction) => {
        try {

            
            
            const embed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle(`${client.user.username} - Commands.`)
                .setDescription('Below is RDAFs Dutch Protection commands, what they do, and the permissions.\n\n**Bot Main Developer Commands**\n\n/dev: Gives/removes a user dev access for developer commands\n\n/log: Determines where the server logs go (not webhook logs).\n\n**Administrator Commands**\n\n/dashboard: Returns an embed with dashboard links for RDAF (Dyno, RoVer)\n\n**G Bot Permissions**\n\n/ban: Ban a user from the server.\n\n/unban: Unban a user from the server.\n\n**SWB Permissions**\n\n/strike: Gives/Removes a strike to a user. Stored in DB\n\n/warning: Gives/Removes a warning to a user. Stored in DB\n\n**General Officer Permissions**\n\n/rally: Begin rally tracking.\n\nAccess to the Administrator /officer commands.\n\n**Officer Commands**\n\n/officer - Everything an RDAF Officer needs.\n\n**Event Permissions**\n\n/eventlog: Able to execute event log.\n\n**NOTE**: Subcommands have not been made into this embed.**')
                .setFooter({ text: `${client.user.username} - Helping RDAF`, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            // Edit the placeholder reply with the bot information embed
            await interaction.reply({ embeds: [embed], ephemeral: false });

            // Log event if the log channel exists
            const logChannelData = await LogChannel.findOne(); // Get log channel from DB

            if (logChannelData) {
                const logChannel = await client.channels.fetch(logChannelData.logChannelId);
                const timestamp = Math.floor(Date.now() / 1000);  // Get timestamp in seconds
                const logEmbed = new EmbedBuilder()
                    .setColor("#0000ff")
                    .setTitle("Command Executed")
                    .setDescription(`The **/dashboard** command was run by <@${interaction.user.id}>`)
                    .addFields(
                        { name: "Executed At", value: `<t:${timestamp}:F>` }  // Discord timestamp format
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

            // Webhook logging setup
            const webhookUrl = process.env.WEBHOOK_URL; // Store the webhook URL in the .env file
            const uptime = process.uptime();
            const now =  Math.floor(interaction.createdAt / 1000)
            const logData = {
                content: `-\nCommand: /commands was executed by <@${interaction.user.id}> at <t:${now}:F> in the main RDAF server.\n-`,
            };

            // Send the log data to the webhook
            try {
                await axios.post(webhookUrl, logData);
            } catch (error) {
                console.error("Failed to log to webhook:", error);
            }

        } catch (error) {
            console.error('Error displaying bot information:', error);
            await interaction.reply({
                content: 'There was an error displaying the bot information.',
                ephemeral: true
            });
        }
    }
};
