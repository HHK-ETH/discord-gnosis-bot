import { TextChannel, MessageEmbed } from 'discord.js';

const messageEmbed = new MessageEmbed()
  .setURL('https://gnosis-safe.io/app/matic:' + process.env.GNOSIS_ADDRESS + '/transactions/history')
  .setTimestamp();

export async function compareAndNotify(txs: any, oldTxs: any, textChannel: TextChannel): Promise<void> {
  const amountOfNewTxs: number = txs.results.length - oldTxs.results.length;
  //notify txs state change
  for (let i = oldTxs.results.length - amountOfNewTxs - 1; i >= 0; i -= 1) {
    const oldTxState = oldTxs.results[i];

    if (!oldTxState.isExecuted) {
      //tx was not executed, check new state
      const newTxState = txs.results[i + amountOfNewTxs];
      if (newTxState.isExecuted) {
        await notifyExecution(newTxState, textChannel);
      }
    }
  }
  //notify new txs
  if (amountOfNewTxs > 0) {
    for (let i = amountOfNewTxs - 1; i >= 0; i -= 1) {
      const txState = txs.results[i];
      await notifyNewTx(txState, textChannel);
    }
  }
}

async function notifyExecution(txState: any, textChannel: TextChannel): Promise<void> {
  console.log('notify execution');
  const msg = messageEmbed;
  msg
    .setTitle('New multisig transaction executed.')
    .setDescription('Transaction hash: ' + txState.transactionHash)
    .addField('Nonce', txState.nonce.toString(), false)
    .addField('Execution date', txState.executionDate, false)
    .addField('Executor', txState.executor, false);
  await textChannel.send({ embeds: [msg] });
}

async function notifyNewTx(txState: any, textChannel: TextChannel): Promise<void> {
  console.log('notify creation!');
  const msg = messageEmbed;
  msg
    .setTitle('New multisig transaction submitted.')
    .setDescription('Safe hash: ' + txState.safeTxHash)
    .addField('Nonce', txState.nonce.toString(), false)
    .addField('Submission date', txState.submissionDate, false)
    .addField('Confirmation required to execute', (1 - txState.confirmations.length).toString(), false);
  await textChannel.send({ embeds: [msg] });
}
