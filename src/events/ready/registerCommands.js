require("colors");

const commandComparing = require("../../utils/commandComparing");
const getApplicationCommands = require("../../utils/getApplicationCommands");
const getLocalCommands = require("../../utils/getLocalCommands");

module.exports = async (client) => {
  try {
    const localCommands = getLocalCommands();
    const applicationCommands = await getApplicationCommands(client);

    for (const localCommand of localCommands) {
      const commandName = localCommand.data.name;
      const existingCommand = applicationCommands.cache.find((cmd) => cmd.name === commandName);

      if (existingCommand) {
        if (localCommand.deleted) {
          await applicationCommands.delete(existingCommand.id);
          console.log(`Application command ${commandName} has been deleted.`.red);
          continue;
        }

        const differentCommand = commandComparing(localCommand.data, existingCommand);
        if (differentCommand) {
          await applicationCommands.edit(existingCommand.id, differentCommand);
          console.log(`Application command ${commandName} has been edited.`.yellow);
        }
      } else {
        if (localCommand.deleted) {
          console.log(`Skipped registering ${commandName} as it's marked for deletion.`.grey);
          continue;
        }

        await applicationCommands.create(localCommand.data);
        console.log(`Application command ${commandName} has been registered.`.green);
      }
    }
  } catch (err) {
    console.log("[ERROR]".red + " Error in your registerCommands.js file:");
    console.log(err);
  }
};
