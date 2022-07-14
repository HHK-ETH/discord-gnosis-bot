import dotenv from 'dotenv';
import { Client, Intents, TextChannel } from 'discord.js';
import StorageHelper from './src/storageHelper';
import { querySafeTxs } from './src/gnosis';
import { compareAndNotify, replyUnsignedTxs } from './src/notify';
dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });
const storageHelper = StorageHelper.getInstance();

const routine = async function (textChannel: TextChannel) {
  if (!process.env.GNOSIS_ADDRESS) {
    throw Error('Gnosis address not set.');
  }

  const txs = await querySafeTxs(process.env.GNOSIS_ADDRESS);
  if (txs === null) {
    //error querying the api.
    return;
  }
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

        //add commands
        client.on('interactionCreate', async (interaction) => {
          if (!interaction.isCommand()) return;

          const { commandName } = interaction;

          if (commandName === 'safe-infos') {
            await interaction.deferReply({ ephemeral: true });
            const txs = await storageHelper.read();
            await replyUnsignedTxs(txs, interaction);
          }
        });
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
