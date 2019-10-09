const { compileContract } = require('./utils/compiler.js');
const { serializeAndSign } = require('./utils/helper.js');

const {
  node1,
  node2,
  node3,
} = require('./utils/environment.js');
let temperatureMonitor = {};

const main = async () => {
  const { interface, bytecode } = compileContract('temperatureMonitor.sol');
  temperatureMonitor = {
    interface,
    bytecode,
  };

  const contractAddress = await deployContract(node1, [node2.TM_PK]);
  console.log(`Contract deployed at address: ${contractAddress}`);

  const statusUnAuthorized = await setTemp({
    to: contractAddress,
    node: node3,
    privateFor: [node1.TM_PK],
    temp: 8,
  });

  console.log(`Set Temp status from unauthorized node:  ${statusUnAuthorized}`);
  const resultUnAuthorized = await getTemp({
    contractAddress,
    node: node3,
  });
  console.log(`Contract temperature: ${resultUnAuthorized}`);

  const status = await setTemp({
    to: contractAddress,
    node: node2,
    privateFor: [node1.TM_PK],
    temp: 22,
  });
  console.log(`Set temp status from authorized node: ${status}`);
  const result = await getTemp({
    contractAddress,
    node: node2,
  });
  console.log(`Contract temperature after update: ${result}`);
};

async function deployContract(node, privateFor) {
  // encode contract
  const contract = new node.web3.eth.Contract(temperatureMonitor.interface);
  const encodedABI = contract
    .deploy({
      data: temperatureMonitor.bytecode,
    })
    .encodeABI();

  // store the bytecode in tessera using the storeRawRequest API
  const rawTxHash = await node.txManager.storeRawRequest(
    encodedABI,
    node.TM_PK,
  );

  const privateSignedTxHex = await serializeAndSign(node, {
    to: '',
    data: `0x${rawTxHash}`,
  });

  return node.txManager
    .sendRawRequest(privateSignedTxHex, privateFor)
    .then(tx => {
      console.log(tx);

      return tx.contractAddress;
    })
    .catch(console.log);
}

async function setTemp({ to, node, privateFor, temp}) {
  const encodedABI = node.web3.eth.abi.encodeFunctionCall(
    temperatureMonitor.interface.find(x => x.name === 'set'),
    [temp],
  );
  
  const rawTxHash = await node.txManager.storeRawRequest(encodedABI, node.TM_PK);

  const privateSignedTxHex = await serializeAndSign(node, {
    to,
    data: `0x${rawTxHash}`,
  });

  console.log('privateSignedTxHex', privateSignedTxHex);

  return node.txManager
    .sendRawRequest(privateSignedTxHex, privateFor)
    .then(tx => {
      console.log(tx);

      return `${tx.status} - ${tx.blockHash}`;
    })
    .catch(error => error.message);
}

async function getTemp({ contractAddress, node }) {
  const contract = new node.web3.eth.Contract(
    temperatureMonitor.interface,
    contractAddress,
  );

  return contract.methods
    .get().call({
      from: node.WALLET_ADDRESS,
    })
    .then(data => data)
    .catch(error => error.message);
}

main();