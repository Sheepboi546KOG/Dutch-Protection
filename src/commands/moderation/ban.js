const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv/config"); 
const roundup = require("../../schemas/roundup");
const loggingChannelId = "1149083816317702305"; 
const requiredRoleId = "1283853933562957836"; 

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server.")
    .addUserOption((option) =>
      option.setName("user").setDescription("User to ban").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for banning the user").setRequired(false)
    )
    .addAttachmentOption((option) =>
      option.setName("evidence").setDescription("Evidence for the ban").setRequired(false)
    ),

  run: async (client, interaction) => {
    try {
     
      const member = interaction.guild.members.cache.get(interaction.user.id);

      if (!member || !member.roles.cache.has(requiredRoleId)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#e44144")
              .setTitle("Unauthorized Access")
              .setDescription("You do not have permission to use this command.")
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      }

      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided";
      const evidence = interaction.options.getAttachment("evidence");

      if (user.id === interaction.user.id) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff0000")
              .setTitle("Error")
              .setDescription("You cannot ban yourself.")
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      }

      const botMember = interaction.guild.members.cache.get(client.user.id);
      const targetMember = interaction.guild.members.cache.get(user.id);

      if (targetMember) {
        if (
          targetMember.roles.highest.position >= botMember.roles.highest.position ||
          targetMember.roles.highest.position >= member.roles.highest.position
        ) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle("Error")
                .setDescription("You cannot ban this user because they have a higher role than you or the bot.")
                .setTimestamp(),
            ],
            ephemeral: true,
          });
        }
      }

      try {
        await interaction.guild.members.ban(user, { reason });
        const RoundUp = await roundup.findOne({}); 
                if (RoundUp) {
                  roundup.Bans += 1; 
                  await roundup.save(); 
                }
        const loggingChannel = await client.channels.fetch(loggingChannelId);
        if (loggingChannel) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("User Banned")
            .setDescription(`**User:** <@${user.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Banned by:** <@${interaction.user.id}>\n**Evidence:** ${evidence ? `See below` : "None"}`)
            .setTimestamp();

          if (evidence) embed.setImage(evidence.url);

          loggingChannel.send({ embeds: [embed] });
        }

        const webhookUrl = process.env.WEBHOOK_URL;
        const webhookUrl2 = process.env.PUNISHWEB_URL;
        const now = Math.floor(interaction.createdAt / 1000);

        const logData = {
          content: `-\nADMIN COMMAND RAN\nCommand: /ban was executed by <@${interaction.user.id}> at <t:${now}:F> in the main RDAF server.\n@everyone>`,
        };

        const logData2 = {
          content: `**User Banned**\n**User:** <@${user.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Banned by:** <@${interaction.user.id}>\n**Evidence:** ${evidence ? `See below` : "None"}`,
        };

        await axios.post(webhookUrl, logData).catch((error) => console.error("Failed to log to webhook:", error));
        await axios.post(webhookUrl2, logData2).catch((error) => console.error("Failed to log to punishment webhook:", error));

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#00ff00")
              .setTitle("User Banned")
              .setDescription(`User <@${user.id}> has been banned for: ${reason}`)
              .setTimestamp(),
          ],
          ephemeral: true,
        });

      } catch (banError) {
        console.error("Error banning user:", banError);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ff0000")
              .setTitle("Failed to Ban User")
              .setDescription("An error occurred while trying to ban the user. Please use the built-in /ban command, and contact Sheepboi546 immediately.")
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      }

    } catch (err) {
      console.error("[ERROR] Error in ban command:", err);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("Error Occurred")
            .setDescription("An error occurred while processing your request. Please use the built-in /ban command instead.")
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }
  },
};
