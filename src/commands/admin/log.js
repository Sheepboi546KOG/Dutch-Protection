const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const LogChannel = require("../../schemas/log"); // Import the LogChannel schema

// Replace this with your Discord ID
const YOUR_DISCORD_ID = '1138235120424325160';

module.exports = {
  data: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Configure the logging channel or view logs.")
    .addSubcommand(subcommand =>
      subcommand
        .setName("set")
        .setDescription("Set the channel for logging")
        .addChannelOption(option => option.setName("channel").setDescription("The channel to log events").setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName("view")
        .setDescription("View the current logging channel")),

  run: async (client, interaction) => {
    try {
      
      const subcommand = interaction.options.getSubcommand();

      // Set log channel
      if (subcommand === "set") {
        const channel = interaction.options.getChannel("channel");

        // Check if the user is the authorized user (the bot owner)
        if (interaction.user.id !== YOUR_DISCORD_ID) {
          const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("Unauthorized Access")
            .setDescription("You are not authorized to set the log channel.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if a log channel already exists in the database
        const existingLogChannel = await LogChannel.findOne();
        if (existingLogChannel) {
          existingLogChannel.logChannelId = channel.id;
          await existingLogChannel.save();
        } else {
          // If no log channel exists, create a new one
          const newLogChannel = new LogChannel({
            logChannelId: channel.id,
          });
          await newLogChannel.save();
        }

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Log Channel Set")
          .setDescription(`The log channel has been set to ${channel}.`)
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: false });
      }

      // View current log channel
      if (subcommand === "view") {
        const logChannelData = await LogChannel.findOne();

        if (!logChannelData) {
          const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("No Log Channel Set")
            .setDescription("There is currently no log channel configured.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: false });
        }

        const channel = await client.channels.fetch(logChannelData.logChannelId);
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Current Log Channel")
          .setDescription(`The current log channel is ${channel}.`)
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: false });
      }

    } catch (err) {
      console.error("[ERROR]".red + "Error in your log command:");
      console.error(err);

      const embed = new EmbedBuilder()
        .setColor("#ff0000") // Red color for error
        .setTitle("Error Occurred")
        .setDescription("An error occurred while processing your request. Please try again later.")
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
