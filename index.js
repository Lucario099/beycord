// ─── Render Keep-Alive ───────────────────────────────────────────────────────
require('./keepalive.js'); // Ensure this path is correct

// ─── Beycord Setup ──────────────────────────────────────────────────────────
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");
const path = require("path");

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
const commandsPath = path.join(__dirname, "commands");

fs.readdirSync(commandsPath).forEach(file => {
  if (file.endsWith(".js")) {
    try {
      const pull = require(path.join(commandsPath, file));
      const name = file.split(".")[0];
      cmds.set(name, pull);
      if (pull.help?.aliases) {
        pull.help.aliases.forEach(alias => aliases.set(alias, name));
      }
    } catch (err) {
      console.error(`Failed to load command ${file}:`, err);
    }
  }
});

// ─── Event: Bot Ready ────────────────────────────────────────────────────────
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ─── Event: Message Create ───────────────────────────────────────────────────
client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const cmdFile = cmds.get(command) || cmds.get(aliases.get(command));
  
  if (cmdFile) {
    const cmdt = new Date();
    try {
      await cmdFile.run(client, message, args, prefix, null, db, cmdt);
    } catch (e) {
      console.error(`Error executing ${command}:`, e);
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