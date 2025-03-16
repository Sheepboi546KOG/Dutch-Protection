const { SlashCommandBuilder } = require("discord.js");
const RoundUp = require('../../schemas/roundup'); // Adjust the path as necessary
const Officer = require('../../schemas/officer'); // Adjust the path as necessary

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roundup")
    .setDescription("Display current RoundUp values and reset them to 0."),
deleted: true,
  run: async (client, interaction) => {
    try {
      const allowedRoleId = "1339301327569682432"; // Specific role ID
      const member = interaction.guild.members.cache.get(interaction.user.id);

      // Check if the user has the required role
      if (!member || !member.roles.cache.has(allowedRoleId)) {
        return interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
      }

      // Fetch the existing RoundUp document
      let roundup = await RoundUp.findOne({});
      if (!roundup) {
        // If no document exists, create one
        roundup = new RoundUp();
      }

      // Fetch the officer data to find the one who hosted the most events
      const officers = await Officer.find({});
      const mostEventsOfficer = officers.reduce((prev, current) => (prev.eventsHosted > current.eventsHosted) ? prev : current, officers[0]);

      // Determine star and target messages
      const starMessage = (roundup.eventsHosted > 5) 
        ? "⭐ Excellent Events this week, many events have been hosted, so excellent work on that." 
        : "⭐ Good week in RDAF without any issues, we could be better overall; good week.";
        
      const targetMessage = (roundup.eventsHosted < 3) 
        ? "🎯 Let's try and push for more events this week, as less than 3 were hosted!" 
        : "🎯 Events were good this week; however, a few more would be great!";
        
      const officerAddedMessage = (roundup.OfficerAdded >= 1) 
        ? "We've also inducted some new officers, please welcome them!" 
        : "";
        
      const officerRemovedMessage = (roundup.OfficerRemoved >= 1) 
        ? "We've sadly lost an officer, and their service was great." 
        : "";

      // Create the message content
      const messageContent = `${starMessage}\n${targetMessage}\n${officerAddedMessage}\n${officerRemovedMessage}\n` +
        `**This weeks summary:**\n` +
        `- Events Hosted: ${roundup.eventsHosted}\n` +
        `- Officers Added: ${roundup.OfficerAdded}\n` +
        `- Officers Updated: ${roundup.OfficerUpdated}\n` +
        `- Officers Removed: ${roundup.OfficerRemoved}\n` +
        `- Bans: ${roundup.Bans}\n` +
        `- Strikes: ${roundup.Strikes}\n` +
        `- Warnings: ${roundup.Warnings}\n\n` +
        `**Most Events Hosted:** <@${mostEventsOfficer ? mostEventsOfficer.userId : "No officers found."}>`;

      // Fetch the specific channel to send the message
      const channel = await client.channels.fetch("1147980843785142297"); // Channel ID
      await channel.send(messageContent); // Send message to the specified channel

      // Reset all RoundUp values to 0
      roundup.eventsHosted = 0;
      roundup.OfficerAdded = 0;
      roundup.OfficerUpdated = 0;
      roundup.OfficerRemoved = 0;
      roundup.Bans = 0;
      roundup.Strikes = 0;
      roundup.Warnings = 0;

      await roundup.save(); // Save the updated document

      // Send confirmation of reset
      return interaction.reply({
        content: "✅ The current RoundUp values have been sent to the specified channel.",
        ephemeral: true,
      });
    } catch (err) {
      console.error("[ERROR] Error in roundup command:", err);
      return interaction.reply({
        content: "❌ An error occurred while processing your request. Please try again later.",
        ephemeral: true,
      });
    }
  },
};