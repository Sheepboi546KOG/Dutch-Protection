const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { v4: uuidv4 } = require("uuid");
const Strike = require("../../schemas/strike");
const Dev = require("../../schemas/dev");
const loggingChannelId = "1149083816317702305"; // Replace with your logging channel ID
const axios = require('axios'); // Import axios for HTTP requests
require('dotenv').config(); // Load environment variables from .env file
const roundup = require("../../schemas/roundup")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("strike")
    .setDescription("Manage strikes.")
    .addSubcommand(subcommand =>
      subcommand
        .setName("give")
        .setDescription("Give a strike to a user")
        .addUserOption(option => option.setName("user").setDescription("User to strike").setRequired(true))
        .addStringOption(option => option.setName("reason").setDescription("Reason for the strike").setRequired(true))
        .addAttachmentOption(option => option.setName("image").setDescription("Image evidence").setRequired(false))) // Optional image
    
    .addSubcommand(subcommand =>
      subcommand
        .setName("check")
        .setDescription("Check all strikes for a user")
        .addUserOption(option => option.setName("user").setDescription("User to check strikes for").setRequired(true)))
    
    .addSubcommand(subcommand =>
      subcommand
        .setName("remove")
        .setDescription("Remove a strike from a user")
        .addStringOption(option => option.setName("strikeid").setDescription("ID of the strike to remove").setRequired(true))
        .addStringOption(option => option.setName("reason").setDescription("Reason for strike removal").setRequired(true))),

  run: async (client, interaction) => {
    try {
      
      const requiredRoleId = "1283874757586190398"; // The role ID required to run this command

      // Check if the user has the required role
      const member = interaction.guild.members.cache.get(interaction.user.id);

      if (!member || !member.roles.cache.has(requiredRoleId)) {
        // If the user doesn't have the required role, send an error message
        const embed = new EmbedBuilder()
          .setColor("#e44144")
          .setTitle("Unauthorized Access")
          .setDescription("You do not have permission to use this command.")
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const subcommand = interaction.options.getSubcommand();
      const user = interaction.user;

      // Webhook logging setup
      const webhookUrl = process.env.WEBHOOK_URL;
      const webhookUrl2 = process.env.PUNISHWEB_URL;
      const uptime = process.uptime();
      const now = Math.floor(interaction.createdAt / 1000)
      const logData = {
        content: `-\nCommand: /${subcommand}, underneath the /strike command, was executed by <@${user.id}> at <t:${now}:F> in the main RDAF server.\n-`,
      };

      // Send the log data to the webhook
      try {
        await axios.post(webhookUrl, logData);
      } catch (error) {
        console.error("Failed to log to webhook:", error);
      }

      // Handle /strike give (giving a strike)
      if (subcommand === "give") {
        const userToStrike = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason");
        const image = interaction.options.getAttachment("image");

        // Prevent striking yourself
        if (userToStrike.id === interaction.user.id) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Invalid Action")
            .setDescription("You cannot strike yourself.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Prevent striking the bot
        if (userToStrike.id === client.user.id) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Invalid Action")
            .setDescription("You cannot strike the bot.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Prevent striking someone with a higher role
        const memberToStrike = interaction.guild.members.cache.get(userToStrike.id);
        if (memberToStrike.roles.highest.position >= member.roles.highest.position) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Invalid Action")
            .setDescription("You cannot strike someone with a higher role.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Generate a unique strike ID
        const strikeId = uuidv4();

        const newStrike = new Strike({
          strikeId, // Storing the generated unique ID
          userId: userToStrike.id,
          reason,
          image: image ? image.url : null, // Save image URL if provided
        });

        await newStrike.save();

        // Log the strike
        const loggingChannel = await client.channels.fetch(loggingChannelId);
        const embed = new EmbedBuilder()
          .setColor("#e44144")
          .setTitle("New Strike Issued")
          .setDescription(`**Strike:** <@${userToStrike.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Striking Officer:** <@${interaction.user.id}>\n**Evidence:** ${image ? `See below` : "None"}`)
          .setTimestamp();

          const roundup = await roundup.findOne({}); // Assuming you have a single RoundUp document
                if (roundup) {
                  roundup.Strikes += 1; // Increment by 1
                  await roundup.save(); // Save the updated document
                }

        if (image) embed.setImage(image.url);

        loggingChannel.send({ embeds: [embed] });
         const logData2 = {
                  content: `**User Striked**\n**User:** <@${userToStrike.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Striked by:** <@${interaction.user.id}>\nEvidence can be found in the RDAF punishement logs.`,
                };
        
                await axios.post(webhookUrl2, logData2).catch((error) => console.error("Failed to log to webhook:", error));
        const embedResponse = new EmbedBuilder()
          .setColor("#e44144")
          .setTitle("Strike Issued")
          .setDescription(`User <@${userToStrike.id}> has been striked for: ${reason}\n**Punishment ID:** ${strikeId}`)
          .setTimestamp();
        return interaction.reply({ embeds: [embedResponse], ephemeral: true });
      }

      // Handle /strike remove (removing a strike)
      if (subcommand === "remove") {
        const strikeId = interaction.options.getString("strikeid");
        const removalReason = interaction.options.getString("reason");

        if (!strikeId || !removalReason) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Missing Information")
            .setDescription("Please provide both a valid Strike ID and a reason for removal.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Find the strike by its ID
        const strike = await Strike.findOne({ strikeId });

        if (!strike) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Strike Not Found")
            .setDescription(`No strike with ID ${strikeId} was found.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Prevent removing a strike from yourself
        if (strike.userId === interaction.user.id) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Invalid Action")
            .setDescription("You cannot remove a strike from yourself.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Prevent removing a strike from the bot
        if (strike.userId === client.user.id) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Invalid Action")
            .setDescription("You cannot remove a strike from the bot.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Prevent removing a strike from someone with a higher role
        const memberToRemoveStrike = interaction.guild.members.cache.get(strike.userId);
        if (memberToRemoveStrike.roles.highest.position >= member.roles.highest.position) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Invalid Action")
            .setDescription("You cannot remove a strike from someone with a higher role.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Proceed with removing the strike
        await strike.deleteOne({ strikeId });

        // Log the strike removal
        const loggingChannel = await client.channels.fetch(loggingChannelId);
        const embed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("Strike Removed")
          .setDescription(`**Strike ID:** ${strikeId}\n**User:** <@${strike.userId}>\n**Original Reason:** ${strike.reason}\n**Removal Reason:** ${removalReason}\n**Removing Officer**: <@${interaction.user.id}>\n**Date Removed:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Evidence:** ${strike.image ? "See below" : "None"}`)
          .setTimestamp();

        if (strike.image) embed.setImage(strike.image);

        loggingChannel.send({ embeds: [embed] });
        const logData3 = {
          content: `**Strike ID:** ${strikeId}\n**User:** <@${strike.userId}>\n**Original Reason:** ${strike.reason}\n**Removal Reason:** ${removalReason}\n**Removing Officer**: <@${interaction.user.id}>\n**Date Removed:** <t:${Math.floor(Date.now() / 1000)}:F>\nEvidence can be found in the RDAF punishement logs.`
        };

        await axios.post(webhookUrl2, logData3).catch((error) => console.error("Failed to log to webhook:", error));
        // Send confirmation to the interaction
        const embedResponse = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("Strike Removed")
          .setDescription(`Strike ID ${strikeId} has been successfully removed.`)
          .setTimestamp();
        return interaction.reply({ embeds: [embedResponse], ephemeral: true });
      }

      // Handle /strike check (check strikes)
      if (subcommand === "check") {
        const userToCheck = interaction.options.getUser("user");
        const strikes = await Strike.find({ userId: userToCheck.id });

        if (strikes.length === 0) {
          const embed = new EmbedBuilder()
            .setColor("#2da4cc")
            .setTitle("No Strikes Found")
            .setDescription(`No strikes have been recorded for <@${userToCheck.id}>.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const strikeList = strikes.map((strike) => `
          **Strike ID:** ${strike.strikeId}
          **Reason:** ${strike.reason}
          **Date Issued:** <t:${Math.floor(new Date(strike.date).getTime() / 1000)}:F>
        `).join("\n");

        const embed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("User Strikes")
          .setDescription(`Strikes for <@${userToCheck.id}>:\n\n${strikeList}`)
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (err) {
      console.error("[ERROR]".red + "Error in strike command:");
      console.error(err);
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Error Occurred")
        .setDescription("An error occurred while processing your request. Please try again later.")
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
