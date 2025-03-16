const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const LogChannel = require('../../schemas/log'); // Import the LogChannel model
const axios = require('axios'); // Import axios for HTTP requests
require('dotenv').config(); // Load environment variables from .env file

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('dashboards for RDAF')
        .toJSON(),
    
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [], // No special permissions are needed for this command
    run: async (client, interaction) => {
        try {

            
            
            const embed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle(`${client.user.username} - Dashboards`)
                .setDescription('Ajutta: https://auttaja.io/dashboard\nDyno: https://dyno.gg/manage/1147980842484903988\nRoManager: https://romanager.bot/\nRover: https://rover.link/guilds/1147980842484903988\nUnbelievabot: https://unbelievaboat.com/dashboard/1147980842484903988\n\n Please contact Sheepboi546 if you need more adding to the list!')
                .setFooter({ text: `${client.user.username} - Helping RDAF`, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            // Edit the placeholder reply with the bot information embed
            await interaction.reply({ embeds: [embed], ephemeral: true });

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
                content: `-\nCommand: /dashboard was executed by <@${interaction.user.id}> at <t:${now}:F> in the main RDAF server.\n-`,
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
