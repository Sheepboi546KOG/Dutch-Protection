const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const loggingChannelId = "1149083816317702305";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from the server.")
    .addUserOption(option => option.setName("user").setDescription("User to unban").setRequired(true))
    .addStringOption(option => option.setName("reason").setDescription("Reason for unbanning the user").setRequired(false)),
  
  run: async (client, interaction) => {
    try {
      
      const requiredRoleId = "1283853933562957836";

      const member2 = interaction.guild.members.cache.get(interaction.user.id);

      if (!member2 || !member2.roles.cache.has(requiredRoleId)) {
        const embed = new EmbedBuilder()
          .setColor("#e44144")
          .setTitle("Unauthorized Access")
          .setDescription("You do not have permission to use this command.")
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided";

      try {
        await interaction.guild.members.unban(user, { reason });
      } catch (err) {
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("Failed to Unban User")
          .setDescription("An error occurred while trying to unban the user. Please use the built-in /unban command and contact Sheepboi546 immediately.")
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const loggingChannel = await client.channels.fetch(loggingChannelId);
      const embed = new EmbedBuilder()
        .setColor("#2da4cc")
        .setTitle("User Unbanned")
        .setDescription(`**User:** <@${user.id}>\n**Reason:** ${reason}\n**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Unbanned by:** <@${interaction.user.id}>`)
        .setTimestamp();

      loggingChannel.send({ embeds: [embed] });

      const webhookUrl = process.env.WEBHOOK_URL;
      const uptime = process.uptime();
      const now = Math.floor(interaction.createdAt / 1000)
      const logData = {
        content: `-\nADMIN COMMAND RAN\nCommand: /ban was executed by <@${interaction.user.id}> at <t:${now}:F> in the main RDAF server.\n<@everyone>`,
      };

        try {
              await axios.post(webhookUrl, logData);
            } catch (error) {
              console.error("Failed to log to webhook:", error);
            }

      const embedResponse = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("User Unbanned")
        .setDescription(`User <@${user.id}> has been unbanned for: ${reason}`)
        .setTimestamp();
      return interaction.reply({ embeds: [embedResponse], ephemeral: true });

    } catch (err) {
      console.error("[ERROR]".red + "Error in unban command:");
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
