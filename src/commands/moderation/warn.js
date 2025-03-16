const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { v4: uuidv4 } = require("uuid");  // Importing uuid package
const Warning = require("../../schemas/warn"); // Importing the Warning model
const loggingChannelId = "1149083816317702305"; // Replace with your logging channel ID
const axios = require('axios'); // Import axios for HTTP requests
require('dotenv').config(); // Load environment variables from .env file

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Manage warnings.")
    .addSubcommand(subcommand =>
      subcommand
        .setName("give")
        .setDescription("Give a warning to a user")
        .addUserOption(option => option.setName("user").setDescription("User to warn").setRequired(true))
        .addStringOption(option => option.setName("reason").setDescription("Reason for the warning").setRequired(true))
        .addAttachmentOption(option => option.setName("image").setDescription("Image evidence").setRequired(false))) // Optional image
    
    .addSubcommand(subcommand =>
      subcommand
        .setName("check")
        .setDescription("Check all warnings for a user")
        .addUserOption(option => option.setName("user").setDescription("User to check warnings for").setRequired(true)))
    
    .addSubcommand(subcommand =>
      subcommand
        .setName("remove")
        .setDescription("Remove a warning from a user")
        .addStringOption(option => option.setName("warningid").setDescription("ID of the warning to remove").setRequired(true))
        .addStringOption(option => option.setName("reason").setDescription("Reason for warning removal").setRequired(true))),


  run: async (client, interaction) => {
    try {
    
      // Check if the user has the required role
      const requiredRoleId = "1283874757586190398"; // The role ID required to run this command
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
      const now =  Math.floor(interaction.createdAt / 1000)
      const logData = {
        content: `-\nCommand: /${subcommand}, underneath the /warn command, was executed by <@${user.id}> at <t:${now}:F> in the main RDAF server.\n-`,
      };

      // Send the log data to the webhook
      try {
        await axios.post(webhookUrl, logData);
      } catch (error) {
        console.error("Failed to log to webhook:", error);
      }

      // Handle /warn give (giving a warning)
      if (subcommand === "give") {
        const warnedUser = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason");
        const image = interaction.options.getAttachment("image");

        // Prevent warning if the user is warning themselves, the bot, or someone with an equal or higher role
        if (warnedUser.id === interaction.user.id) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Invalid Action")
            .setDescription("You cannot warn yourself.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (warnedUser.bot) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Invalid Action")
            .setDescription("You cannot warn a bot.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const warnedMember = await interaction.guild.members.fetch(warnedUser.id);
        if (warnedMember.roles.highest.position >= member.roles.highest.position) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Invalid Action")
            .setDescription("You cannot warn a user with an equal or higher role than yours.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Generate a unique warning ID
        const warningId = uuidv4();

        const newWarning = new Warning({
          warningId, // Storing the generated unique ID
          userId: warnedUser.id,
          reason,
          image: image ? image.url : null, // Save image URL if provided
        });

        await newWarning.save();

        // Log the warning
        const loggingChannel = await client.channels.fetch(loggingChannelId);
        const embed = new EmbedBuilder()
          .setColor("#e44144")
          .setTitle("New Warning Issued")
          .setDescription(`**Warning:** <@${warnedUser.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Warning Officer:** <@${interaction.user.id}>\n**Evidence:** ${image ? `See below` : "None"}`)
          .setTimestamp();

        if (image) embed.setImage(image.url);

        loggingChannel.send({ embeds: [embed] });
         const logData2 = {
                          content: `**User Warned**\n**User:** <@${warnedUser.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Warning Officer** <@${interaction.user.id}>\nEvidence can be found in the RDAF punishement logs.`,
                        };
                
                        await axios.post(webhookUrl2, logData2).catch((error) => console.error("Failed to log to webhook:", error));

                const RoundUp = require("../../schemas/roundup")
                const roundup = await RoundUp.findOne({}); // Assuming you have a single RoundUp document
                if (roundup) {
                  roundup.OfficerRemoved += 1; // Increment by 1
                  await roundup.save(); // Save the updated document
                }
        const embedResponse = new EmbedBuilder()
          .setColor("#e44144")
          .setTitle("Warning Issued")
          .setDescription(`User <@${warnedUser.id}> has been warned for: ${reason}\n**Warning ID:** ${warningId}`)
          .setTimestamp();
        return interaction.reply({ embeds: [embedResponse], ephemeral: true });
      }

      // Handle /warn remove (removing a warning)
      if (subcommand === "remove") {

        if (!member || !member.roles.cache.has(requiredRoleId)) {
          // If the user doesn't have the required role, send an error message
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Unauthorized Access")
            .setDescription("You do not have permission to use this command.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const warningId = interaction.options.getString("warningid");
        const removalReason = interaction.options.getString("reason");

        if (!warningId || !removalReason) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Missing Information")
            .setDescription("Please provide both a valid Warning ID and a reason for removal.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Find the warning by its ID
        const warning = await Warning.findOne({ warningId });

        if (!warning) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Warning Not Found")
            .setDescription(`No warning with ID ${warningId} was found.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Proceed with removing the warning
        await warning.deleteOne({ warningId });

        // Log the warning removal
        const loggingChannel = await client.channels.fetch(loggingChannelId);
        const embed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("Warning Removed")
          .setDescription(`**Warning ID:** ${warningId}\n**User:** <@${warning.userId}>\n**Original Reason:** ${warning.reason}\n**Removal Reason:** ${removalReason}\n**Removing Officer**: <@${interaction.user.id}>\n**Date Removed:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Evidence:** ${warning.image ? "See below" : "None"}`)
          .setTimestamp();

        if (warning.image) embed.setImage(warning.image);

        loggingChannel.send({ embeds: [embed] });
        const logData3 = {
                  content: `**Strike ID:** ${warningId}\n**User:** <@${warning.userId}>\n**Original Reason:** ${warning.reason}\n**Removal Reason:** ${removalReason}\n**Removing Officer**: <@${interaction.user.id}>\n**Date Removed:** <t:${Math.floor(Date.now() / 1000)}:F>\nEvidence can be found in the RDAF punishement logs.`
                };
        
                await axios.post(webhookUrl2, logData3).catch((error) => console.error("Failed to log to webhook:", error));
        // Send confirmation to the interaction
        const embedResponse = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("Warning Removed")
          .setDescription(`Warning ID ${warningId} has been successfully removed.`)
          .setTimestamp();
        return interaction.reply({ embeds: [embedResponse], ephemeral: true });
      }

      // Handle /warn check (check warnings)
      if (subcommand === "check") {
        const userToCheck = interaction.options.getUser("user");
        const warnings = await Warning.find({ userId: userToCheck.id });

        if (warnings.length === 0) {
          const embed = new EmbedBuilder()
            .setColor("#2da4cc")
            .setTitle("No Warnings Found")
            .setDescription(`No warnings have been recorded for <@${userToCheck.id}>.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const warningList = warnings.map((warning) => `
          **Warning ID:** ${warning.warningId}
          **Reason:** ${warning.reason}
          **Date Issued:** <t:${Math.floor(new Date(warning.date).getTime() / 1000)}:F>
        `).join("\n");

        const embed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("User Warnings")
          .setDescription(`Warnings for <@${userToCheck.id}>:\n\n${warningList}`)
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

    } catch (err) {
      console.error("[ERROR]".red + "Error in warn command:");
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
