const rp = require('request-promise-native');

const getAccount = uri =>
  rp({
    method: 'POST',
    uri,
    json: true,
    body: {
      jsonrpc: '2.0',
      method: 'eth_accounts',
      params: [],
      id: 1,
    },
  })
    .then(res => res.result[0])
    .catch(error => new Error(error));

const getNonce = async (address, uri) => {
  return rp({
    method: 'POST',
    uri,
    json: true,
    body: {
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [
        address,
        'pending',
      ],
      id: 1,
    },
  }).then(res => res.result)
  .catch(error => new Error(error));
};

module.exports = {
  getAccount,
  getNonce,
};