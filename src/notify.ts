import { TextChannel, MessageEmbed } from 'discord.js';
import { Contract, BigNumber, ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { ERC20_ABI } from './../imports';
import dotenv from 'dotenv';
dotenv.config();

const PROVIDER = new ethers.providers.JsonRpcProvider(process.env.RPC);

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
  const description = await decodeData(txState.to, txState.data, txState.value);

  const msg = new MessageEmbed()
    .setTitle('New multisig transaction executed.')
    .setDescription(description)
    .addField('Transaction hash', txState.transactionHash)
    .addField('Nonce', txState.nonce.toString(), true)
    .addField('Execution date', txState.executionDate, true)
    .addField('Executor', txState.executor, false)
    .setURL('https://gnosis-safe.io/app/matic:' + process.env.GNOSIS_ADDRESS + '/transactions/history')
    .setTimestamp();
  await textChannel.send({ embeds: [msg] });
}

async function notifyNewTx(txState: any, textChannel: TextChannel): Promise<void> {
  const description = await decodeData(txState.to, txState.data, txState.value);
  const confirmationsNeeded =
    process.env.SECURITY !== undefined ? parseInt(process.env.SECURITY, 10) - txState.confirmations.length : 0;

  const msg = new MessageEmbed()
    .setTitle('New multisig transaction submitted.')
    .setDescription(description)
    .addField('Safe hash', txState.safeTxHash)
    .addField('Nonce', txState.nonce.toString(), true)
    .addField('Submission date', txState.submissionDate, true)
    .addField('Confirmation required to execute', confirmationsNeeded.toString() + ' remaining.', false)
    .setURL('https://gnosis-safe.io/app/matic:' + process.env.GNOSIS_ADDRESS + '/transactions/queue')
    .setTimestamp();
  await textChannel.send({ embeds: [msg] });
}

async function decodeData(address: string, data: string, value: BigNumber): Promise<string> {
  const erc20value = await erc20decoder(address, data, value);
  if (erc20value !== null) {
    return erc20value;
  }
  return 'Unable to decode this transaction.';
}

async function erc20decoder(address: string, data: string, value: BigNumber): Promise<string | null> {
  const erc20 = new Contract(address, ERC20_ABI, PROVIDER);
  try {
    const decoded = erc20.interface.parseTransaction({ data, value });
    const tokenName = await erc20.symbol();
    const decimals = await erc20.decimals();
    if (decoded.name === 'transferFrom' || decoded.name === 'transfer') {
      const amount = decoded.args.amount;
      const receiver = decoded.args.recipient;
      return 'Transfer ' + formatUnits(amount, decimals) + ' ' + tokenName + ' from multisig to ' + receiver;
    }
    if (decoded.name === 'approve') {
      const amount = decoded.args.amount;
      const spender = decoded.args.spender;
      return 'Approve ' + formatUnits(amount, decimals) + ' ' + tokenName + ' on ' + spender;
    }
    return null;
  } catch (e) {
    return null;
  }
}
