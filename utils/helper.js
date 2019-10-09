const EthereumTx = require('ethereumjs-tx').Transaction;
const Common = require('ethereumjs-common').default;
const { getNonce } = require("./jsonRPC.js");

const customConfig = (id) => Common.forCustomChain(
  'mainnet',
  {
    networkId: id,
    chainId: id,
  },
  'homestead',
);

const serializePayload = async (node, { to, data }) => {
  const nonce = await getNonce(node.WALLET_ADDRESS, node.RPC);

  const rawTransaction = {
    data,
    nonce,
    to,
    gasPrice: 0,
    gasLimit: 4300000,
    value: 0,
  };

  const common = customConfig(node.NETWORK_ID);
  const tx = new EthereumTx(rawTransaction, { common });
  tx.sign(Buffer.from(node.WALLET_KEY, 'hex')); // WALLET PRIVATE KEY

  return `0x${tx.serialize().toString('hex')}`;
};

const setPrivate = (txManager, payload) => {
  const privateSignedTx = txManager.setPrivate(payload);

  return `0x${privateSignedTx.toString('hex')}`;
};

const serializeAndSign = async (node, payload) => {
  const serializedPayload = await serializePayload(node, payload);

  return setPrivate(node.txManager, serializedPayload);
};

module.exports = {
  serializePayload,
  serializeAndSign,
};