require("dotenv/config");

const { Client, GatewayIntentBits } = require("discord.js");
const eventHandler = require("./handlers/eventHandler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required for reading message content
     // Required for handling interactions like modals, slash commands, etc.
  ],
});

eventHandler(client); // Register events

client.login(process.env.TOKEN);
console.log("If you see this, make sure to do cliffs thing in all the other commands!")
