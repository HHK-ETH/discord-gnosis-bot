import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { Client, Intents } from 'discord.js';
dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });
const guilds = process.env.GUILDS.split(' ');
let gasData = null;

setInterval(async function () {
  try {
    const fetchGasPrice = await fetch('https://api.blocknative.com/gasprices/blockprices', {
      method: 'GET',
      headers: {
        Authorization: process.env.BLOCKNATIVE_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    gasData = await fetchGasPrice.json();
  } catch (e) {
    console.log(e);
  }
  if (client.user && gasData.blockPrices) {
    client.user.setActivity(
      'Fast=' +
        Math.round(
          gasData.blockPrices[0].baseFeePerGas + gasData.blockPrices[0].estimatedPrices[0].maxPriorityFeePerGas
        ) +
        ' Slow=' +
        Math.round(gasData.blockPrices[0].baseFeePerGas + 1),
      {
        type: 'PLAYING',
      }
    );
    guilds.forEach(async (guildId) => {
      const guild = client.guilds.cache.get(guildId);
      const user = await guild.members.fetch(client.user.id);
      await user.setNickname(Math.round(gasData.blockPrices[0].baseFeePerGas + 1) + ' GWEI');
    });
  }
}, 60_000);

client.login(process.env.DISCORD_TOKEN);
