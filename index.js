const Eris = require("eris");
const MongoClient = require("mongodb").MongoClient;
const fs = require("fs");
const express = require("express");

// ─── Keepalive Web Server ─────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (_req, res) => res.send("Beycord Bot is alive!"));
app.listen(PORT, () => console.log(`Web server listening on port ${PORT}`));

// ─── Bot Setup ───────────────────────────────────────────────────────────
const prefix = ";";
let db;
let cmds = new Map();
let aliases = new Map();
const client = new Eris(process.env.TOKEN, {
  intents: ["guilds", "guildMessages", "guildMembers", "messageContent"]
});

// ─── Load Commands ────────────────────────────────────────────────────────
fs.readdirSync("./commands").forEach(file => {
  if (file.endsWith(".js")) {
    let pull = require(`./commands/${file}`);
    cmds.set(file.split(".")[0], pull);
    if (pull.help && pull.help.aliases) {
      pull.help.aliases.forEach(alias => aliases.set(alias, file.split(".")[0]));
    }
  }
});

// ─── Event: Bot Ready ─────────────────────────────────────────────────────
client.on("ready", () => {
  console.log(`Logged in as ${client.user.username}`);
});

// ─── Event: Message Create ────────────────────────────────────────────────
client.on("messageCreate", async message => {
  if (message.author.bot || !message.guildID || !message.content.startsWith(prefix)) return;

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

// ─── MongoDB Connection ───────────────────────────────────────────────────
MongoClient.connect(process.env.MONGO, { useUnifiedTopology: true })
  .then(database => {
    db = database.db("beycord");
    client.connect(); // Only connect Eris bot after DB is ready
  })
  .catch(console.error);