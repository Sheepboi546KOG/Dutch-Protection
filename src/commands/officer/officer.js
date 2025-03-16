const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Officer = require("../../schemas/officer");
const Strike = require("../../schemas/strike");
const Warn = require("../../schemas/warn")
const RoundUp = require("../../schemas/roundup")
const { WebhookClient } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("officer")
    .setDescription("Manage officers.")
    .addSubcommand(subcommand =>
      subcommand
        .setName("add")
        .setDescription("Add an officer")
        .addUserOption(option =>
          option.setName("user").setDescription("User to add as officer").setRequired(true))
        .addStringOption(option =>
          option.setName("rank").setDescription("Rank of the officer").setRequired(true)
            .addChoices(
              { name: 'E', value: 'E' },
              { name: 'HR1', value: 'HR1' },
              { name: 'HR2', value: 'HR2' },
              { name: 'HR3', value: 'HR3' },
              { name: 'HC1', value: 'HC1' },
              { name: 'HC2', value: 'HC2' },
              { name: 'HC3', value: 'HC3' },
              { name: 'GS1', value: 'GS1' },
              { name: 'GS2', value: 'GS2' },
              { name: 'GS3', value: 'GS3' },
              { name: 'GS4', value: 'GS4' }
            )
        ))
    .addSubcommand(subcommand =>
      subcommand
        .setName("update")
        .setDescription("Update an officer's rank")
        .addUserOption(option =>
          option.setName("user").setDescription("User to update").setRequired(true))
        .addStringOption(option =>
          option.setName("rank").setDescription("New rank of the officer").setRequired(true)
            .addChoices(
              { name: 'E', value: 'E' },
              { name: 'HR1', value: 'HR1' },
              { name: 'HR2', value: 'HR2' },
              { name: 'HR3', value: 'HR3' },
              { name: 'HC1', value: 'HC1' },
              { name: 'HC2', value: 'HC2' },
              { name: 'HC3', value: 'HC3' },
              { name: 'GS1', value: 'GS1' },
              { name: 'GS2', value: 'GS2' },
              { name: 'GS3', value: 'GS3' },
              { name: 'GS4', value: 'GS4' }
            )
        ))
    .addSubcommand(subcommand =>
      subcommand
        .setName("remove")
        .setDescription("Remove an officer")
        .addUserOption(option =>
          option.setName("user").setDescription("User to remove as officer").setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("quota")
        .setDescription("Check officer quotas"))
    .addSubcommand(subcommand =>
      subcommand
        .setName("checker")
        .setDescription("Check an officer's details")
        .addUserOption(option =>
          option.setName("user").setDescription("User to check").setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("loa_add")
        .setDescription("Add LOA to an officer")
        .addUserOption(option =>
          option.setName("user").setDescription("User to add LOA").setRequired(true))
        .addStringOption(option =>
          option.setName("reason").setDescription("Reason for LOA").setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("loa_remove")
        .setDescription("Remove LOA from an officer")
        .addUserOption(option =>
          option.setName("user").setDescription("User to remove LOA").setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("officer_quota_conclude")
        .setDescription("Conclude and reset officer quotas"))
        
      
        .addSubcommand(subcommand =>
          subcommand
            .setName("event_setter")
            .setDescription("Set an officer's event count to something else.")
            .addUserOption(option =>
              option.setName("user")
                .setDescription("User to update event count for")
                .setRequired(true))
            .addIntegerOption(option =>
              option.setName("events")
                .setDescription("Events Hosted.")
                .setRequired(true)
                .setMinValue(0) // Optional: To ensure only positive values are input
            )),
        

  run: async (client, interaction) => {
    try {
      const subcommand = interaction.options.getSubcommand();
      const allowedRoleId = '1339301327569682432'; 
      const generalOfficerId = '1287787309701267519' // Replace with the actual role ID for reset quota
      const member = interaction.guild.members.cache.get(interaction.user.id);
      // Webhook Client setup
      const webhook = new WebhookClient({
        url: 'https://discord.com/api/webhooks/1300805351154909235/qa3XU8ofiT64-94azdTtcGklX2Bunqo9vPYR4yiH9aQD6_WaNWaABj1q_m7y-qPs_t9y' // Replace with your actual webhook URL
      });

      if (subcommand === "add") {
        const user = interaction.options.getUser("user");
        const rank = interaction.options.getString("rank");
    
        if (!member || !member.roles.cache.has(allowedRoleId)) {
            // If the user doesn't have the required role, send an error message
            const embed = new EmbedBuilder()
                .setColor("#e44144")
                .setTitle("Unauthorized Access")
                .setDescription("You do not have permission to use this command.")
                .setTimestamp();
            return interaction.reply({ embeds: [embed]});
        }
    
        const existingOfficer = await Officer.findOne({ userId: user.id });
        if (existingOfficer) {
            const embed = new EmbedBuilder()
                .setColor("#e44144")
                .setTitle("Error")
                .setDescription(`<@${user.id}> is already an officer.`)
                .setTimestamp();
            return interaction.reply({ embeds: [embed],  });
        }
    
        const officer = new Officer({
            userId: user.id,
            rank,
            joined: Date.now(),
        });
    
        try {
            // Defer the reply to avoid timeout while processing the request
            await interaction.deferReply({  });
    
            // Save officer to the database
            await officer.save();
    
            // Create the success embed for the interaction
            const embed2 = new EmbedBuilder()
                .setColor("#2da4cc")
                .setTitle("Officer Added")
                .setDescription(`User: <@${user.id}>\nRank: ${rank}`)
                .setTimestamp();

                const roundup = await RoundUp.findOne({}); // Assuming you have a single RoundUp document
                if (roundup) {
                  roundup.OfficerAdded += 1; // Increment by 1
                  await roundup.save(); // Save the updated document
                }
            // S end webhook notification
            await webhook.send({
                content: `Command: /add, underneath the /officer command, was executed by <@${interaction.user.id}> at <t:${Math.floor(interaction.createdAt / 1000)}:F> in the main RDAF server. New Officer Added: User: <@${user.id}>, Rank: ${rank}`
            });
    
            // Send DM to the new officer
            await user.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#2da4cc")
                        .setTitle("You have been registered as an Officer!")
                        .setDescription(`Welcome to the RDAF Officer Corps and congratulations on being inducted! Your 2-week ensign phase starts now.\nTo get started, make sure to join the following group: https://www.roblox.com/communities/34534708/SEA-RDAF-Officers-Club#!/about , this is to receive your officer uniform in-game.\nAs an officer, you are expected to uphold our values and rules and set an example.\n\nThe main command you need to know is /eventlog. You can find the message for help in the event channel.\n\nCongratulations for joining the officer team!\n\n- The GS team.`)
                        .setTimestamp()
                ]
            });
    
            // Now update the deferred reply with the success message
            return interaction.editReply({ embeds: [embed2] });
    
        } catch (error) {
            // Handle any errors that occur during the database operation or any other async tasks
            console.error("Error adding officer:", error);
            const errorEmbed = new EmbedBuilder()
                .setColor("#e44144")
                .setTitle("Error")
                .setDescription("An error occurred while adding the officer.")
                .setTimestamp();
            return interaction.editReply({ embeds: [errorEmbed] });
        }
    }
    
    

      if (subcommand === "quota") {
        if (!member || !member.roles.cache.has(generalOfficerId)) {
            const embed = new EmbedBuilder()
                .setColor("#e44144")
                .setTitle("Unauthorized Access")
                .setDescription("You do not have permission to use this command.")
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    
        const officers = await Officer.find();
    
        if (officers.length === 0) {
            const embed = new EmbedBuilder()
                .setColor("#e44144")
                .setTitle("No Officers Found")
                .setDescription("There are currently no officers registered.")
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    
        const embed = new EmbedBuilder()
        .setColor("#2da4cc")
        .setTitle("Officer Quota Status");
    
    let description = "";
    
    officers.forEach((officer) => {
        let quotaPassed = false;
        const eventsHosted = officer.eventsHosted || 0;
    
        // If on LOA, automatically pass quota
        if (officer.loa?.status) {
            quotaPassed = true;
        } else {
            if (
                (['E', 'HR1', 'HR2', 'HR3'].includes(officer.rank) && eventsHosted >= 1) ||
                (['HC1', 'HC2', 'HC3'].includes(officer.rank) && eventsHosted >= 2) ||
                (['GS1', 'GS2', 'GS3', 'GS4'].includes(officer.rank) && eventsHosted >= 0)
            ) {
                quotaPassed = true;
            }
        }
    
        // Display ✅ if quota passed, ❌ if not
        let quotaStatus = quotaPassed ? "✅" : "❌";
    
        // Append (LOA) next to the quota status if on LOA
        if (officer.loa?.status) {
            quotaStatus += " (LOA)";
        }
    
        description += `**<@${officer.userId}>** - Rank: ${officer.rank} | Quota: ${quotaStatus}\n`;
    });
    
    embed.setDescription(description);
    
    await interaction.reply({ embeds: [embed], ephemeral: false });
  }    
    

      if (subcommand === "update") {
        const user = interaction.options.getUser("user");
        const newRank = interaction.options.getString("rank");

        if (!member || !member.roles.cache.has(allowedRoleId)) {
          // If the user doesn't have the required role, send an error message
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Unauthorized Access")
            .setDescription("You do not have permission to use this command.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed] });
        }
      
        const officer = await Officer.findOne({ userId: user.id });
        if (!officer) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Error")
            .setDescription(`<@${user.id}> is not an officer.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed],  });
        }
      
        // Update rank and rankUpdate timestamp
        officer.rank = newRank;
        officer.rankUpdate = Date.now();  // Save the current time as the rankUpdate
      
        // Save the officer document to the database
        await officer.save();
      
        // Now that the officer is saved, retrieve the updated officer (to get the new rankUpdate value)
        const updatedOfficer = await Officer.findOne({ userId: user.id });
      
        const embed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("Officer Updated")
          .setDescription(`User: <@${user.id}>\nNew Rank: ${newRank}\nRank Update: <t:${Math.floor(updatedOfficer.rankUpdate / 1000)}:F>`)  // Display the updated rank update timestamp
          .setTimestamp();
        
          const roundup = await RoundUp.findOne({}); // Assuming you have a single RoundUp document
                if (roundup) {
                  roundup.OfficerUpdated += 1; // Increment by 1
                  await roundup.save(); // Save the updated document
                }
        // Send the webhook message with the update information
        await webhook.send({
          content: `Command: /update, underneath the /officer command, was executed by <@${interaction.user.id}> at <t:${Math.floor(interaction.createdAt / 1000)}:F> in the main RDAF server. Officer Rank Updated: User: <@${user.id}>, New Rank: ${newRank}, Rank Update: <t:${Math.floor(updatedOfficer.rankUpdate / 1000)}:F>`
        });
      
        return interaction.reply({ embeds: [embed] });
      }
      
      if (subcommand === "remove") {
    const user = interaction.options.getUser("user");

    if (!member || !member.roles.cache.has(allowedRoleId)) {
        // If the user doesn't have the required role, send an error message
        const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Unauthorized Access")
            .setDescription("You do not have permission to use this command.")
            .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const officer = await Officer.findOneAndDelete({ userId: user.id, });
    if (!officer) {
        const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Error")
            .setDescription(`<@${user.id}> is not registered as an officer.`)
            .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Officer Removed")
        .setDescription(`User: <@${user.id}> has been removed from the officer registry.`)
        .setTimestamp();

        const roundup = await RoundUp.findOne({}); // Assuming you have a single RoundUp document
                if (roundup) {
                  roundup.OfficerRemoved += 1; // Increment by 1
                  await roundup.save(); // Save the updated document
                }

    await webhook.send({
        content: `Command: /remove, underneath the /officer command, was executed by <@${interaction.user.id}> at <t:${Math.floor(interaction.createdAt / 1000)}:F> in the main RDAF server. Officer Removed: User: <@${user.id}>`
    });

    return interaction.editReply({ embeds: [embed] });
}
      if (subcommand === "event_setter") {
        const user = interaction.options.getUser("user");
        const eventsHosted = interaction.options.getInteger("events"); // Get the new events count
      
        if (!member || !member.roles.cache.has(allowedRoleId)) {
          // If the user doesn't have the required role, send an error message
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Unauthorized Access")
            .setDescription("You do not have permission to use this command.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        // Find the officer
        const officer = await Officer.findOne({ userId: user.id });
        if (!officer) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Error")
            .setDescription(`<@${user.id}> is not registered as an officer.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed],  });
        }
      
        // Calculate the difference in events
        const eventDifference = eventsHosted - officer.eventsHosted;
      
        // Update eventTotal based on the difference
        officer.eventsTotal += eventDifference;
      
        // Update eventsHosted to the new value
        officer.eventsHosted = eventsHosted;
      
        // Save the updated officer data
        await officer.save();
      
        const embed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("Officer Events Hosted Changed")
          .setDescription(`User: <@${user.id}> now has ${eventsHosted} events hosted. Event Total has been updated to ${officer.eventsTotal}.`)
          .setTimestamp();
      
        // Send the webhook message
        await webhook.send({
          content: `Command: /event_setter, underneath the /officer command, was executed by <@${interaction.user.id}> at <t:${Math.floor(interaction.createdAt / 1000)}:F> in the main RDAF server.`
        });
      
        // Send the final response to the user
        return interaction.reply({ embeds: [embed] });
      }
    

      if (subcommand === "loa_add") {
        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason");
        const loaRoleId = '1314961667863351306';
        if (!member || !member.roles.cache.has(allowedRoleId)) {
          // If the user doesn't have the required role, send an error message
          const embed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Unauthorized Access")
        .setDescription("You do not have permission to use this command.")
        .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const officer = await Officer.findOne({ userId: user.id });
        if (!officer) {
          const embed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Error")
        .setDescription(`<@${user.id}> is not an officer.`)
        .setTimestamp();
          return interaction.reply({ embeds: [embed],  });
        }

        officer.loa = { status: true, reason };
        await officer.save();

        // Add LOA role to the user
        const guildMember = interaction.guild.members.cache.get(user.id);
        await guildMember.roles.add(loaRoleId);

        const embed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("LOA Added")
          .setDescription(`<@${user.id}> has been granted LOA. Reason: ${reason}`)
          .setTimestamp();

        await webhook.send({
          content: `Command: /loa_add, underneath the /officer command, was executed by <@${interaction.user.id}> at <t:${Math.floor(interaction.createdAt / 1000)}:F> in the main RDAF server. LOA Added: User: <@${user.id}>, Reason: ${reason}`
        });

        await user.send({
          embeds: [
        new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("Your LOA has been approved!")
          .setDescription(`Reason: ${reason}\nEnjoy your break!`)
          .setTimestamp()
          ]
        });

        return interaction.reply({ embeds: [embed] });
      }

      if (subcommand === "loa_remove") {
        const user = interaction.options.getUser("user");
        const loaRoleId = '1314961667863351306';

        if (!member || !member.roles.cache.has(allowedRoleId)) {
          // If the user doesn't have the required role, send an error message
          const embed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Unauthorized Access")
        .setDescription("You do not have permission to use this command.")
        .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const officer = await Officer.findOne({ userId: user.id });
        if (!officer || !officer.loa?.status) {
          const embed = new EmbedBuilder()
        .setColor("#e44144")
        .setTitle("Error")
        .setDescription(`<@${user.id}> doesn't have LOA or isn't an officer.`)
        .setTimestamp();
          return interaction.reply({ embeds: [embed],  });
        }

        officer.loa = { status: false };
        await officer.save();

        // Remove LOA role from the user
        const guildMember = interaction.guild.members.cache.get(user.id);
        await guildMember.roles.remove(loaRoleId);

        const embed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("LOA Removed")
          .setDescription(`<@${user.id}> has had their LOA removed.`)
          .setTimestamp();

          await user.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#2da4cc")
            .setTitle("LOA concluded.")
            .setDescription(`Your LOA has been removed/ended. Your Quota has now returned. If you need an extension, please say so in https://discord.com/channels/1147980842484903988/1150938373108813864.`)
            .setTimestamp()
        ]
          });

        await webhook.send({
          content: `Command: /loa_remove, underneath the /officer command, was executed by <@${interaction.user.id}> at <t:${Math.floor(interaction.createdAt / 1000)}:F> in the main RDAF server. LOA Removed: User: <@${user.id}>`
        });

        return interaction.reply({ embeds: [embed] });
      }

      if (subcommand === "checker") {

        if (!member || !member.roles.cache.has(generalOfficerId)) {
          // If the user doesn't have the required role, send an error message
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Unauthorized Access")
            .setDescription("You do not have permission to use this command.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const user = interaction.options.getUser("user");
        const officer = await Officer.findOne({ userId: user.id });
        const Strikes = await Strike.countDocuments({ userId: user.id });
        const Warns = await Warn.countDocuments({ userId: user.id });
      
        // Find the most recent strike and warning
        const lastStrike = await Strike.findOne({ userId: user.id }).sort({ date: -1 });
        const lastWarn = await Warn.findOne({ userId: user.id }).sort({ date: -1 });
      
        if (!officer) {
          const embed = new EmbedBuilder()
            .setColor("#e44144")
            .setTitle("Error")
            .setDescription(`<@${user.id}> is not an officer.`)
            .setTimestamp();
          return interaction.reply({ embeds: [embed],  });
        }
      
        // Handle LOA status
        const loaStatus = officer.loa.status ? "✔️" : "❌";
      
        // Handle empty or zero warnings/strikes
        const lastStrikeDate = lastStrike ? `<t:${Math.floor(lastStrike.date / 1000)}:F>` : "No Strikes";
        const lastWarnDate = lastWarn ? `<t:${Math.floor(lastWarn.date / 1000)}:F>` : "No Warnings";
      
        // Get leaderboard based on total events hosted
        const officers = await Officer.find().sort({ eventsTotal: -1 }); // Sort by total events hosted
        let leaderboard = "";
        let officerRank = null;
      
        officers.forEach((officerItem, index) => {
          let rankSuffix = '';
          let medal = ''; // Medal variable
      
          const rank = index + 1;
      
          if (rank === 1) {
            rankSuffix = '1st';
            medal = '🥇'; // Gold medal
          } else if (rank === 2) {
            rankSuffix = '2nd';
            medal = '🥈'; // Silver medal
          } else if (rank === 3) {
            rankSuffix = '3rd';
            medal = '🥉'; // Bronze medal
          } else {
            rankSuffix = `${rank}th`;
          }
      
          if (officerItem.userId === user.id) {
            officerRank = `${medal} ${rankSuffix}`;
          }
      
          leaderboard += `**${medal} ${rankSuffix}.** <@${officerItem.userId}> - ${officerItem.eventsTotal} events\n`;
        });
      
        // If officerRank is null, set a fallback message for user not found in leaderboard
        if (!officerRank) officerRank = "Not found in leaderboard.";
      
        const embed = new EmbedBuilder()
          .setColor("#2da4cc")
          .setTitle("Officer Details")
          .setDescription(`User: <@${user.id}>\nRank: ${officer.rank}\nJoined: <t:${Math.floor(officer.joined / 1000)}:F>\nOn LOA: ${loaStatus}\n\n**Moderation History**\nWarnings: ${Warns > 0 ? Warns : "No Warnings"}\nLast Warning: ${lastWarnDate}\nStrikes: ${Strikes > 0 ? Strikes : "No Strikes"}\nLast Strike: ${lastStrikeDate}\nTotal Moderation Count: ${Warns + Strikes}\n\n**Quota Information**\nCurrent Event Quota: ${getQuotaStatus(officer.rank, officer.eventsHosted)}\nQuotas Failed: ${officer.quotasFailed > 0 ? officer.quotasFailed : "No Quota Failures"}\n\n**Misc**\nAll time events: ${officer.eventsTotal}\nLeaderboard Position: ${officerRank}`)
          
          .setThumbnail(user.avatarURL()) // Set user's avatar as embed icon
          .setFooter({ text: user.username })
          .setTimestamp();
      
        function getQuotaStatus(rank, eventsHosted) {
          let requiredEvents = 0;
      
          // Determine the required number of events based on the officer's rank
          if (['E', 'HR1', 'HR2', 'HR3'].includes(rank)) {
            requiredEvents = 1;
          } else if (['HC1', 'HC2', 'HC3'].includes(rank)) {
            requiredEvents = 2;
          } else if (['GS1', 'GS2', 'GS3', 'GS4'].includes(rank)) {
            requiredEvents = 0;  // GS ranks have no required events
          }
      
          // Display the completed events out of the required quota
          return `${eventsHosted}/${requiredEvents}`;
        }
      
        return interaction.reply({ embeds: [embed] });
      }
      
      if (subcommand === "officer_quota_conclude") {
        try {
          const allowedRoleId = "1339301327569682432"; // Specific role ID
          const member = interaction.guild.members.cache.get(interaction.user.id);
      
          // Check if the user has the required role
          if (!member || !member.roles.cache.has(allowedRoleId)) {
            const embed = new EmbedBuilder()
              .setColor("#e44144")
              .setTitle("Unauthorized Access")
              .setDescription("You do not have permission to use this command.")
              .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
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
            : "🎯 Events were good this week; lets try push this week for more recruitment!";
              
          const officerAddedMessage = (roundup.OfficerAdded >= 1) 
            ? "We've also inducted some new officers, please welcome them warmly!" 
            : "";
              
          const officerRemovedMessage = (roundup.OfficerRemoved >= 1) 
            ? "We've sadly lost officer(s), their service to this division was good 🫡" 
            : "";
      
          // Create the message content for RoundUp
          const messageContent = `<@&1287787309701267519># RDAF Officer Round Up!\n\n${starMessage}\n${targetMessage}\n${officerAddedMessage}\n${officerRemovedMessage}\n` +
            `**This week's summary:**\n` +
            `- Events Hosted: ${roundup.eventsHosted}\n` +
            `- Officers Added: ${roundup.OfficerAdded}\n` +
            `- Officers Updated: ${roundup.OfficerUpdated}\n` +
            `- Officers Removed: ${roundup.OfficerRemoved}\n` +
            `- Bans: ${roundup.Bans}\n` +
            `- Strikes: ${roundup.Strikes}\n` +
            `- Warnings: ${roundup.Warnings}\n\n` +
            `**Most Events Hosted:** <@${mostEventsOfficer ? mostEventsOfficer.userId : "No officers found."}>, Please congratulate them for their hard earned work!`;
      
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
      
          // Officer quota logic
          const failedOfficers = [];
          const resetPromises = [];
      
          officers.forEach((officer) => {
            if (officer.loa?.status) return;  // Skip if officer is on LOA
      
            let quotaPassed = false;
            const eventsHosted = officer.eventsHosted || 0;
      
            // Check if the officer has passed their quota
            if (
              (['E', 'HR1', 'HR2', 'HR3'].includes(officer.rank) && eventsHosted >= 1) ||
              (['HC1', 'HC2', 'HC3'].includes(officer.rank) && eventsHosted >= 2) ||
              (['GS1', 'GS2', 'GS3', 'GS4'].includes(officer.rank) && eventsHosted >= 0)
            ) {
              quotaPassed = true;
            }
      
            // If the officer failed the quota
            if (!quotaPassed) {
              failedOfficers.push({
                userId: officer.userId,
                rank: officer.rank,
                eventsHosted
              });
      
              // Increment quotasFailed by 1 for officers who failed the quota
              resetPromises.push(
                Officer.updateOne(
                  { userId: officer.userId },
                  { $inc: { quotasFailed: 1 } }  // Increment quotasFailed by 1
                )
              );
            }
      
            // Reset eventsHosted to 0 for all officers
            resetPromises.push(
              Officer.updateOne(
                { userId: officer.userId },
                { $set: { eventsHosted: 0 } }
              )
            );
          });
      
          await Promise.all(resetPromises);
      
          const embed = new EmbedBuilder()
            .setColor("#2da4cc")
            .setTitle("Officer Quotas Reset")
            .setDescription("All officer quotas have been reset. Officer roundup sent, have an awesome new week! Below are the officers who failed their quota:");
      
          if (failedOfficers.length > 0) {
            let failedList = "";
            failedOfficers.forEach((officer) => {
              failedList += `<@${officer.userId}> (Rank: ${officer.rank}) - Events Completed: ${officer.eventsHosted}\n`;
            });
            embed.addFields({ name: "Failed Quotas", value: failedList });
          } else {
            embed.addFields({ name: "Failed Quotas", value: "No officers failed their quotas. This is truly an amazing moment!" });
          }
      
          await webhook.send({
            content: `Command: /officer_quota_conclude was executed by <@${interaction.user.id}> at <t:${Math.floor(interaction.createdAt / 1000)}:F> in the main RDAF server. Officer Quotas Reset`
          });
      
          return interaction.reply({ embeds: [embed] });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: "An error occurred while resetting officer quotas. Please try again.",  });
        }
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: "An error occurred. Please try again.",  });
    }
  }
};