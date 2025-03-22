const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const LogChannel = require('../../schemas/log'); 
const axios = require('axios'); 
require('dotenv').config(); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('dashboards for RDAF')
        .toJSON(),
    
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [], 
    run: async (client, interaction) => {
        try {

            
            
            const embed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle(`${client.user.username} - Dashboards`)
                .setDescription('Ajutta: https://auttaja.io/dashboard\nDyno: https://dyno.gg/manage/1147980842484903988\nRoManager: https://romanager.bot/\nRover: https://rover.link/guilds/1147980842484903988\nUnbelievabot: https://unbelievaboat.com/dashboard/1147980842484903988\n\n Please contact Sheepboi546 if you need more adding to the list!')
                .setFooter({ text: `${client.user.username} - Helping RDAF`, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

           
            await interaction.reply({ embeds: [embed], ephemeral: true });

  
            const logChannelData = await LogChannel.findOne();

            if (logChannelData) {
                const logChannel = await client.channels.fetch(logChannelData.logChannelId);
                const timestamp = Math.floor(Date.now() / 1000);  
                const logEmbed = new EmbedBuilder()
                    .setColor("#0000ff")
                    .setTitle("Command Executed")
                    .setDescription(`The **/dashboard** command was run by <@${interaction.user.id}>`)
                    .addFields(
                        { name: "Executed At", value: `<t:${timestamp}:F>` } 
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }

            // Webhook logging setup
            const webhookUrl = process.env.WEBHOOK_URL; 
            const uptime = process.uptime();
            const now =  Math.floor(interaction.createdAt / 1000)
            const logData = {
                content: `-\nCommand: /dashboard was executed by <@${interaction.user.id}> at <t:${now}:F> in the main RDAF server.\n-`,
            };


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
