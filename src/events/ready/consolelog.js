require("colors");
const mongoose = require("mongoose");
Mango = process.env.MONGO

module.exports = async (client, async) => {
  console.log("[BOT] RDAF Bot has started up succesfully".green);

  if(!Mango) return;
  mongoose.set("strictQuery", true)


  if (await mongoose.connect(Mango)) {
    console.log("[DATABASE] RDAF Bot has conencted to the database succesfully!".blue)
  }
}