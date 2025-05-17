// ─── Render Keep-Alive Server ───────────────────────────────────────────────
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('Beycord Bot is alive!'));
app.listen(PORT, () => console.log(`Web server listening on port ${PORT}`));
// ─────────────────────────────────────────────────────────────────────────────

// ─── Beycord Setup ──────────────────────────────────────────────────────────
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");

const prefix = ";";
let db;
let cmds = new Map();
let aliases = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// ─── Load Commands ───────────────────────────────────────────────────────────
fs.readdirSync("./commands", { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dir => {
    fs.readdirSync(`./commands/${dir.name}`).forEach(file => {
      if (file.endsWith(".js")) {
        let pull = require(`./commands/${dir.name}/${file}`);
        cmds.set(file.split(".")[0], pull);
        if (pull.help && pull.help.aliases) {
          pull.help.aliases.forEach(alias => aliases.set(alias, file.split(".")[0]));
        }
      }
    });
  });

// ─── Event: Bot Ready ────────────────────────────────────────────────────────
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ─── Event: Message Create ───────────────────────────────────────────────────
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

// ─── Connect to MongoDB and Start Bot ────────────────────────────────────────
MongoClient.connect(process.env.MONGO, { useUnifiedTopology: true })
  .then(database => {
    db = database.db("beycord");
    client.login(process.env.TOKEN);
  })
  .catch(console.error);