const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Officer = require("../../schemas/officer");
const axios = require("axios");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rally")
    .setDescription("Manage rally logs")
    .addSubcommand((subcommand) =>
      subcommand.setName("initiate").setDescription("Initiate a new rally")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("excuse")
        .setDescription("Excuse an officer from the rally")
        .addUserOption((option) =>
          option.setName("officer").setDescription("Select an officer to excuse").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unexcuse")
        .setDescription("Unexcuse an officer from the rally")
        .addUserOption((option) =>
          option.setName("officer").setDescription("Select an officer to unexcuse").setRequired(true)
        )
    ),

  run: async (client, interaction) => {
    const allowedRoleId = "1339301327569682432";
    const rallyChannelId = "1344374728151928933";
    const member = interaction.guild.members.cache.get(interaction.user.id);

    if (!member || !member.roles.cache.has(allowedRoleId)) {
      const embed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Unauthorized Access")
        .setDescription("You do not have permission to use this command.")
        .setTimestamp();
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "initiate") {
      const officers = await Officer.find({ guildId: interaction.guild.id }) || [];

      const attendanceList = officers
        .map((officer) => {
          const statusIcon = (officer.loa.status || officer.rallyLOA) ? "✅" : "🕛";
          return `${officer.rank} - <@${officer.userId}>: ${statusIcon}`;
        })
        .join("\n");

      const rallyEmbed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("Rally Log")
        .setDescription(`Rally initiated\n\n✅: On LOA, or have been rally excused.\n\n🕛: No Absenece Put in, expected to be at the rally.\n\n❌: Failed to attend Rally event without excuse.\n\nOfficers' attendance will be tracked below:\n${attendanceList}`)
        .setTimestamp();

      const rallyChannel = await client.channels.fetch(rallyChannelId);
      const rallyMessage = await rallyChannel.send({ contents: "<@&1147980842510061627> <@&1147980842543628422> <@&1211732581586968676>", embeds: [rallyEmbed] });

      client.rallyMessageId = rallyMessage.id;

      const thread = await rallyMessage.startThread({
        name: "Rally Discussion",
        autoArchiveDuration: 10080, // 24 hours
        reason: "Rally event discussion thread\n\nPlease log your absences like this:\n\nName:\nReason for Absence\nPing: (Any GS Staff Here)",
      });

      await thread.send("Rally event discussion thread\n\nPlease log your absences like this:\n\nName:\nReason for Absence\nPing: (Any GS Staff Here)");

      await interaction.reply({ content: "✅ Rally initiated!", flags: 64 });

    } else if (subcommand === "excuse" || subcommand === "unexcuse") {
      const user = interaction.options.getUser("officer");
      const officer = await Officer.findOne({ userId: user.id, guildId: interaction.guild.id });

      if (!officer) {
        return interaction.reply({ content: "❌ This user is not a valid officer.", flags: 64 });
      }

      const alreadyExcused = officer.loa.status || officer.rallyLOA;
      const shouldExcuse = subcommand === "excuse";

      if (shouldExcuse && alreadyExcused) {
        return interaction.reply({ content: "❌ This officer is already excused.", flags: 64 });
      }

      if (!shouldExcuse && !alreadyExcused) {
        return interaction.reply({ content: "❌ This officer is not excused.", flags: 64 });
      }

      officer.rallyLOA = shouldExcuse;
      await officer.save();

      const rallyChannel = await client.channels.fetch(rallyChannelId);
      const rallyMessage = await rallyChannel.messages.fetch(client.rallyMessageId);
      let embed = rallyMessage.embeds[0];

      const newStatus = shouldExcuse ? "✅" : "🕛";
      let updatedDescription = embed.description.replace(
        new RegExp(`(<@${user.id}>: )\\S+`),
        `$1${newStatus}`
      );

      embed = new EmbedBuilder(embed).setDescription(updatedDescription); // Recreate embed with updated description

      await rallyMessage.edit({ embeds: [embed] });

      await interaction.reply({ content: `✅ Officer has been ${shouldExcuse ? "excused" : "unexcused"}!`, flags: 64 });
    }

    const webhookUrl = process.env.WEBHOOK_URL;
    try {
      await axios.post(webhookUrl, {
        content: `Command: /rally ${subcommand} executed by <@${interaction.user.id}>.`,
      });
    } catch (error) {
      console.error("Failed to log to webhook:", error);
    }
  },
};
