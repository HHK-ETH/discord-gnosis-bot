import axios from 'axios';

export async function querySafeTxs(address: string): Promise<any> {
  const query = await axios.get(
    'https://safe-transaction.gnosis.io/api/v1/safes/' + address + '/multisig-transactions/?limit=20'
  );

  if (query.status !== 200) return null;
  return query.data;
}
