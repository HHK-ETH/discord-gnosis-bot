import dotenv from 'dotenv';
import { Client, Intents, TextChannel } from 'discord.js';
import StorageHelper from './src/StorageHelper';
import { querySafeTxs } from './src/gnosis';
import { compareAndNotify } from './src/notify';
dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });
const storageHelper = StorageHelper.getInstance();

const routine = async function (textChannel: TextChannel) {
  if (!process.env.GNOSIS_ADDRESS) {
    throw Error('Gnosis address not set.');
  }

  const txs = await querySafeTxs(process.env.GNOSIS_ADDRESS);
  const oldTxs = await storageHelper.read();

  if (!oldTxs.new) {
    //file not new, compare states and notify
    await compareAndNotify(txs, oldTxs, textChannel);
  }
  //write new state
  await storageHelper.write(txs);
};

//discord api setup
client.login(process.env.DISCORD_TOKEN).then(
  () => {
    if (!process.env.GUILD || !process.env.CHANNEL) throw Error('.env files missing guild or channel id.');

    const guild = client.guilds.cache.get(process.env.GUILD);
    if (!guild) {
      throw Error('Impossible to connect to this guild.');
    }

    guild.channels.fetch(process.env.CHANNEL).then(
      async (channel) => {
        if (!channel) {
          throw Error("Can't connect to this channel.");
        }
        const textChannel = await channel.fetch();
        if (!(textChannel instanceof TextChannel)) {
          throw Error('This channel is not a text channel.');
        }

        //set routine
        setInterval(() => routine(textChannel), 15_000);
      },
      (err) => {
        console.log(err);
        throw Error("Can't connect to this channel.");
      }
    );
  },
  (err) => {
    console.log(err);
    throw Error("Can't connect to discord api.");
  }
);
