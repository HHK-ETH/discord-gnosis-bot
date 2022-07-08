import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { Client, Intents } from 'discord.js';
dotenv.config();

if (!process.env.GUILDS) throw Error;

const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });
const guilds = process.env.GUILDS.split(' ');

setInterval(async function () {
  console.log('ok');
  if (client.user) {
  }
}, 60_000);

client.login(process.env.DISCORD_TOKEN);
