const { compileContract } = require('./utils/compiler.js');
const { getNonce } = require("./utils/jsonRPC.js");
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

  const contractAddress = await deployContract(node3);
  console.log(`Contract deployed at address: ${contractAddress}`);

  const status = await setTemperature({
    node: node2,
    contractAddress,
    temp: 3,
  });
  console.log(`Transaction status: ${status}`);

  const temp = await getTemperature({
    node: node3,
    contractAddress,
  });
  console.log('Retrieved contract Temperature', temp);
};

async function deployContract(node) {
  // encode contract
  const contract = new node.web3.eth.Contract(temperatureMonitor.interface);
  const encodedABI = contract
    .deploy({
      data: temperatureMonitor.bytecode,
    })
    .encodeABI();

  const nonce = await getNonce(node.WALLET_ADDRESS, node.RPC);

  return node.web3.eth.accounts.signTransaction({
    nonce,
    gasPrice: 0,
    gasLimit: 4300000,
    value: 0,
    data: encodedABI,
  }, node.WALLET_KEY)
    .then(payload => {
      return node.web3.eth.sendSignedTransaction(payload.rawTransaction)
        .then(receipt => receipt.contractAddress)
        .catch(error => error.message);
    });
}

async function setTemperature({ node, contractAddress, temp }) {
  const encodedABI = node.web3.eth.abi.encodeFunctionCall(
    temperatureMonitor.interface.find(x => x.name === 'set'),
    [temp],
  );

  const nonce = await getNonce(node.WALLET_ADDRESS, node.RPC);

  return node.web3.eth.accounts.signTransaction({
    nonce,
    to: contractAddress,
    gasLimit: '0x47b760',
    gasPrice: "0x0",
    data: encodedABI,
  }, node.WALLET_KEY)
    .then(payload => {
      return node.web3.eth.sendSignedTransaction(payload.rawTransaction)
        .then(receipt => receipt.status)
        .catch(error => error.message);
    });
}

async function getTemperature({ contractAddress, node }) {
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