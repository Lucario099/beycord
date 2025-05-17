// ─── Render Keep-Alive Server ───────────────────────────────────────────────
const express = require('express');
const app     = express();
const PORT    = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('Beycord Bot is alive!'));
app.listen(PORT, () => console.log(`Web server listening on port ${PORT}`));
// ─────────────────────────────────────────────────────────────────────────────


// ─── Beycord Original Setup ─────────────────────────────────────────────────
// Paste everything below this line from the original `index.js` of the Beycord repo
// For example:
const Discord = require("discord.js");
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.MESSAGE_CONTENT // May need enabling in developer portal
  ]
});

const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const prefix = ";";
let db;
let cmds = new Map();
let aliases = new Map();

fs.readdirSync("./commands").forEach(dir => {
  fs.readdirSync(`./commands/${dir}`).forEach(file => {
    if (file.endsWith(".js")) {
      let pull = require(`./commands/${dir}/${file}`);
      cmds.set(file.split(".")[0], pull);
      if (pull.help && pull.help.aliases) {
        pull.help.aliases.forEach(alias => aliases.set(alias, file.split(".")[0]));
      }
    }
  });
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild || !message.content.startsWith(prefix)) return;

  let args = message.content.slice(prefix.length).trim().split(/ +/g);
  let command = args.shift().toLowerCase();

  let cmdFile = cmds.get(command) || cmds.get(aliases.get(command));
  if (cmdFile) {
    let cmdt = new Date();
    try {
      await cmdFile.run(client, message, args, prefix, null, db, cmdt);
    } catch (e) {
      console.error(e);
    }
  }
});

MongoClient.connect(process.env.MONGO, { useUnifiedTopology: true }, (err, database) => {
  if (err) return console.error(err);
  db = database.db("beycord");
  client.login(process.env.TOKEN);
});