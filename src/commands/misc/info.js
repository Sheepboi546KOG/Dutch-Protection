const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, version: discordVersion } = require('discord.js');
const os = require('os'); // To get system info
const process = require('process'); // To get process info
const LogChannel = require('../../schemas/log'); // Import the LogChannel model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Provides information about how the bot works, and how to get started in RDAF.')
        .toJSON(),
    
    userPermissions: [PermissionFlagsBits],
    botPermissions: [], // No special permissions are needed for this command
    run: async (client, interaction) => {
        try {

            
            // Record the time when the interaction is received
            const receivedTimestamp = Date.now();
            
            // Send a placeholder reply
            const reply = await interaction.reply({ content: 'Getting Bot Info...', fetchReply: true });

            // Measure the latency of the bot
            const botLatency = Date.now() - receivedTimestamp;

            // Measure the API latency
            const apiLatency = client.ws.ping;

            // Calculate uptime (convert from ms to more readable format)
            const uptime = process.uptime(); // uptime in seconds
            const uptimeHours = Math.floor(uptime / 3600);
            const uptimeMinutes = Math.floor((uptime % 3600) / 60);
            const uptimeSeconds = Math.floor(uptime % 60);
            
            // Get the startup timestamp in Unix format
            const startupTimestamp = Math.floor((Date.now() - (uptime * 1000)) / 1000); // Convert to seconds

            // Get system info
            const device = os.hostname(); // Gets the device's hostname
            const platform = `${os.type()} ${os.release()}`; // Get OS type and version
            const nodeVersion = process.version; // Node.js version

            // Prepare an embed with the bot information
            const embed = new EmbedBuilder()
                .setColor('#323232')
                .setTitle(`${client.user.username} - Bot Information`)
                .setDescription('Hello there, I am the current Bot for RDAF, and I am here to assist you.')
                .addFields(
                    { name: 'Features', value: 'Currently, I can moderate users by banning, kicking, and more.' },
                    { name: 'Commands', value: 'Currently, RDAF public members have access to the `/info` command. Members with moderation perms can use the moderation system, and admins can configure it. More commands are expected to release.' },
                    { name: 'Getting Started in RDAF', value: 'Make sure to join the Group and remember the values which can be found in https://discord.com/channels/1147980842484903988/1147980843290210311, Then open the agreement form found in that channel.'},
                    { name: 'Version', value: 'Version 2.51' },
                    // Bold text for section title
                    { name: '**— Bot Performance —**', value: '\u200B' }, // Section title
                    
                    { name: 'Latency', value: `Bot Latency: \`${botLatency}ms\`\nAPI Latency: \`${apiLatency}ms\`` },
                    { 
                        name: 'Uptime', 
                        value: `\`${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s\`\nStarted at: <t:${startupTimestamp}:f>` 
                    },
                    { name: 'Library', value: `discord.js \`${discordVersion}\`` },
                    { name: 'Device', value: `OS: \`${platform}\``},
                    { name: 'Node.js Version', value: `Node.js \`${nodeVersion}\`` },

                    // Bold text for section title, and support info next to title
                    { name: '**— Support & Information —**', value: 'For issues or suggestions, please contact <@1138235120424325160>. Error codes will be displayed if applicable. So send them the screenshot of the error message in DMS.' }
                )
                .setFooter({ text: `${client.user.username} - Helping RDAF`, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            // Edit the placeholder reply with the bot information embed
            await interaction.editReply({ content: null, embeds: [embed] });

            // Log event if the log channel exists
            const logChannelData = await LogChannel.findOne(); // Get log channel from DB

            if (logChannelData) {
                const logChannel = await client.channels.fetch(logChannelData.logChannelId);
                const timestamp = Math.floor(Date.now() / 1000);  // Get timestamp in seconds
                const logEmbed = new EmbedBuilder()
                    .setColor("#0000ff")
                    .setTitle("Command Executed")
                    .setDescription(`The **/info** command was run by <@${interaction.user.id}>`)
                    .addFields(
                        { name: "Executed At", value: `<t:${timestamp}:F>` }  // Discord timestamp format
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
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
