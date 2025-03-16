const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const process = require("process")
const Dev = require("../../schemas/dev"); // Importing the Dev model
const axios = require('axios'); // Import axios for HTTP requests
require('dotenv').config(); // Load environment variables from .env file


const YOUR_DISCORD_ID = '1138235120424325160'; // Replace this with your Discord ID

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dev")
    .setDescription("Manage devs or check dev status.")
    .addSubcommand(subcommand =>
      subcommand
        .setName("add")
        .setDescription("Add a developer to the list")
        .addUserOption(option => option.setName("user").setDescription("User to add as a dev").setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName("delete")
        .setDescription("Remove a developer from the list")
        .addUserOption(option => option.setName("user").setDescription("User to remove from dev list").setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName("checks")
        .setDescription("List all developers")),
 deleted: true,
  run: async (client, interaction) => {
    
    try {
     
      

    
      const subcommand = interaction.options.getSubcommand();
      const user = interaction.user; // Get the user who ran the command

      // Log the command to the webhook
      const webhookUrl = process.env.WEBHOOK_URL;
      const uptime = process.uptime()
      const now = Math.floor((Date.now() - (uptime * 1000)) / 1000)
      const logData = {
        content: `-\nCommand: /${subcommand}, underneath the /dev command, was executed by <@${user.id}> at <t:${now}:F> in the main RDAF server.\n-`,
      };

      // Send the log data to the webhook
      try {
        await axios.post(webhookUrl, logData);
      } catch (error) {
        console.error("Failed to log to webhook:", error);
      }

      if (subcommand === "add") {
        const userToAdd = interaction.options.getUser("user");

        // Check if the command issuer is the owner (your ID)
        if (interaction.user.id !== YOUR_DISCORD_ID) {
          const embed = new EmbedBuilder()
            .setColor("#ff0000") // Red color for unauthorized
            .setTitle("Unauthorized Access")
            .setDescription("You are not authorized to use this command.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Add the user as a developer
        const existingDev = await Dev.findOne({ userId: userToAdd.id });
        if (existingDev) {
          const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("Developer Already Exists")
            .setDescription(`User ${userToAdd.tag} is already a developer.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const newDev = new Dev({ userId: userToAdd.id });
        await newDev.save();

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Developer Added")
          .setDescription(`User ${userToAdd.tag} has been added as a developer!`)
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: false });
      }

      if (subcommand === "delete") {
        const userToDelete = interaction.options.getUser("user");

        // Check if the command issuer is the owner (your ID)
        if (interaction.user.id !== YOUR_DISCORD_ID) {
          const embed = new EmbedBuilder()
            .setColor("#ff0000") // Red color for unauthorized
            .setTitle("Unauthorized Access")
            .setDescription("You are not authorized to use this command.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Remove the user from the developer list
        const dev = await Dev.findOneAndDelete({ userId: userToDelete.id });
        if (!dev) {
          const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("Developer Not Found")
            .setDescription(`User ${userToDelete.tag} is not a developer.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Developer Removed")
          .setDescription(`User ${userToDelete.tag} has been removed as a developer.`)
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: false });
      }

      if (subcommand === "checks") {
        // List all developers
        const devs = await Dev.find();
        if (devs.length === 0) {
          const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("No Developers Found")
            .setDescription("There are no developers currently registered.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: false });
        }

        const devList = devs.map(dev => `<@${dev.userId}>`).join("\n");

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("List of Developers")
          .setDescription(devList || "No developers found.")
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: false });
      }

    } catch (err) {
      console.error("[ERROR]".red + "Error in your devCmd.js run function:");
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
