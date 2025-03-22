const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder } = require("discord.js");
const mongoose = require("mongoose");
const Dev = require("../../schemas/dev");
const LogChannel = require("../../schemas/log");
const Officer = require("../../schemas/officer");
const RoundUp = require("../../schemas/roundup");
const moment = require("moment");
const axios = require("axios");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eventlog")
    .setDescription("Log an event with attendees, co-host, and image evidence.")
    .addBooleanOption((option) =>
      option.setName("sea_hr1").setDescription("Are you a SEA HR1?").setRequired(true)
    )
    .addAttachmentOption((option) =>
      option.setName("image").setDescription("Evidence image").setRequired(true)
    )
    .addUserOption((option) =>
      option.setName("cohost").setDescription("Mention co-host for the event").setRequired(false)
    ),

  run: async (client, interaction) => {
    try {
      const allowedRoleId = "1285618243855450334";
      const member = interaction.guild.members.cache.get(interaction.user.id);

      if (!member || !member.roles.cache.has(allowedRoleId)) {
        const embed = new EmbedBuilder()
          .setColor("#e44144")
          .setTitle("Unauthorized Access")
          .setDescription("You do not have permission to use this command.")
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const seaHr1 = interaction.options.getBoolean("sea_hr1");
      const image = interaction.options.getAttachment("image");
      const cohost = interaction.options.getUser("cohost");
      const channelId = "1148302085713047563";
      const eventSelectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("event_type")
          .setPlaceholder("Select Event Type")
          .addOptions([
            { label: "Patrol", value: "Patrol" },
            { label: "Rally", value: "Rally" },
            { label: "Training", value: "Training" },
            { label: "Tryout", value: "Tryouts" },
            { label: "Gamenight", value: "Gamenight" },
            { label: "Other", value: "Other" },
          ])
      );

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("Event Log")
        .setDescription("Please select the event type below.")
        .setTimestamp();

      const msg = await interaction.reply({
        embeds: [embed],
        components: [eventSelectMenu],
        ephemeral: false,
        fetchReply: true,
      });

      const initialEmbedMessage = msg;
      
      const filter = (i) => i.customId === "event_type" && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 120000,
      });

      collector.on("collect", async (i) => {
        const eventType = i.values[0];

        const attendeesEmbed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Ping the Attendees")
          .setDescription(
            "Mention all the attendees and send it into this channel. Once you've pinged them, click **Done**.\n\nExample: <@475744554910351370><@475744554910351370>"
          )
          .setTimestamp();

        const doneButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("done").setLabel("Done").setStyle(1),
          new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(4)
        );

        const attendeesMsg = await i.reply({
          embeds: [attendeesEmbed],
          components: [doneButton],
          ephemeral: false,
        });

        let attendees = [];
        const attendeeFilter = (btn) => ["done", "cancel"].includes(btn.customId) && btn.user.id === interaction.user.id;

        const attendeeCollector = interaction.channel.createMessageComponentCollector({
          filter: attendeeFilter,
          time: 120000,
        });

        attendeeCollector.on("collect", async (buttonInteraction) => {
          await initialEmbedMessage.delete();
          const attendeesEmbedMessage = attendeesMsg;
          await attendeesEmbedMessage.delete();
          if (buttonInteraction.customId === "done") {

            // General event details
            const finalEmbed = new EmbedBuilder()
              .setColor("#0099ff")
              .setTitle("Event Log Details")
              .addFields(
                { name: "Event Type", value: eventType },
                { name: "Host", value: `<@${interaction.user.id}>` },
                { name: "Co-host", value: cohost ? `<@${cohost.id}>` : "None" },
                { name: "Attendees", value: attendees.join("\n") || "No attendees mentioned." }
              )
              .setImage(image.url)
              .setTimestamp();

            const eventChannel = await client.channels.fetch(channelId);
            const eventMessage = await eventChannel.send({ embeds: [finalEmbed] });
            
            if (eventType === "Rally") {
              const officers = await Officer.find({ guildId: interaction.guild.id });
              const excusedOfficers = officers.filter(officer => officer.rallyLOA || officer.LOA);
              const excusedOfficerMentions = excusedOfficers.map(officer => `<@${officer.userId}>`);

              const failedToAttend = officers.filter(officer => 
                !attendees.includes(`<@${officer.userId}>`) && 
                !excusedOfficerMentions.includes(`<@${officer.userId}>`)
              );
              const failedToAttendMentions = failedToAttend.map(officer => `<@${officer.userId}>`);

              if (eventType === "Rally") 
                finalEmbed.addFields(
                  { name: "Attended/Excused Officers", value: excusedOfficerMentions.join("\n") || "None" },
                  { name: "Failed to Attend", value: failedToAttendMentions.join("\n") || "None" }
                );
              }

            await eventChannel.send(finalEmbed);
            if (seaHr1) {
              const currentDate = moment().format("MM/DD/YY");
              const attendeesCount = attendees.length >= 5 ? "5+" : "No";

              const dmMessage = `**Division**: Royal Dutch Air Force\n**Link to Event**: ${eventMessage.url}\n**Date**: ${currentDate}\n**5+ Attendees?**: ${attendeesCount}\n**Screenshot of Event**: ${image.url}`;

              await interaction.user.send(dmMessage);
            }

            const hostOfficer = await Officer.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
            if (hostOfficer) {
              hostOfficer.eventsHosted += 1;
              hostOfficer.eventsTotal += 1;
              await hostOfficer.save();
            }

            if (cohost) {
              const cohostOfficer = await Officer.findOne({ userId: cohost.id, guildId: interaction.guild.id });
              if (cohostOfficer) {
                cohostOfficer.eventsHosted += 1;
                cohostOfficer.eventsTotal += 1;
                await cohostOfficer.save();
              }
            }

            const roundup = await RoundUp.findOne({}); 
            if (roundup) {
            roundup.eventsHosted += 1; 
            await roundup.save(); 
            }
            await buttonInteraction.reply({
              content: "✅ Event has been logged successfully!",
              ephemeral: true,
            });

            collector.stop();
          } else if (buttonInteraction.customId === "cancel") {
            await buttonInteraction.reply({
              content: "❌ Event log process has been canceled.",
              ephemeral: true,
            });
            collector.stop();
          }
        });

        const mentionFilter = (message) =>
          message.author.id === interaction.user.id && message.content.includes("<@");

        const mentionCollector = interaction.channel.createMessageCollector({
          filter: mentionFilter,
          time: 60000,
        });

        const mentionMessages = []; 

        mentionCollector.on("collect", async (message) => {
          mentionMessages.push(message); 
          const mentionedUsers = message.mentions.users;
          mentionedUsers.forEach((user) => {
            if (!attendees.includes(`<@${user.id}>`)) {
              attendees.push(`<@${user.id}>`);
            }
          });
        });

  
        attendeeCollector.on("end", async () => {
          for (const msg of mentionMessages) {
            await msg.delete(); 
          }
        });
      });

      const webhookUrl = process.env.WEBHOOK_URL;
      const logData = {
        content: `Command: /eventlog executed at <t:${Math.floor(Date.now() / 1000)}:F> in the main RDAF server.`,
      };

      try {
        await axios.post(webhookUrl, logData);
      } catch (error) {
        console.error("Failed to log to webhook:", error);
      }
    } catch (err) {
      console.error("[ERROR] Error in eventlog command:", err);

      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Error Occurred")
        .setDescription("An error occurred while processing your request. Please try again later.")
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};