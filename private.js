const dotenv = require('dotenv');
const Web3 = require('web3');
const fs = require('fs');
const solc = require('solc');

let temperatureMonitor = {};

dotenv.config();

const raft1Node = new Web3(
  new Web3.providers.HttpProvider(process.env.RPC1), null, {
    transactionConfirmationBlocks: 1,
  },
);

const raft2Node = new Web3(
  new Web3.providers.HttpProvider(process.env.RPC2), null, {
    transactionConfirmationBlocks: 1,
  },
);

const raft3Node = new Web3(
  new Web3.providers.HttpProvider(process.env.RPC3), null, {
    transactionConfirmationBlocks: 1,
  },
);

const main = async () => {
  const {interface, bytecode} = formatContract();
  temperatureMonitor = {
    interface: JSON.parse(interface),
    bytecode: `0x${bytecode}`,
  };

  console.log('Formatted Contract:', temperatureMonitor);

  const contractAddress = await deployContract(raft1Node, process.env.PK2);
  console.log(`Contract address after deployment: ${contractAddress}`);

  await setTemperature(raft3Node, contractAddress, process.env.PK1, 10);
  const temp = await getTemperature(raft3Node, contractAddress);
  console.log(`[Node3] temp retrieved after updating contract from external nodes: ${temp}`);

  await setTemperature(raft2Node, contractAddress, process.env.PK1, 12);
  const temp2 = await getTemperature(raft2Node, contractAddress);
  console.log(`[Node2] temp retrieved after updating contract from internal nodes: ${temp2}`);

  const temp3 = await getTemperature(raft3Node, contractAddress);
  console.log(`[Node3] temp retrieved from external nodes after update ${temp}`);
}

function getAddress(web3) {
  return web3.eth.getAccounts().then(accounts => accounts[0]);
}

function formatContract() {
  const source = fs.readFileSync('./contracts/temperatureMonitor.sol', 'UTF8');
  return solc.compile(source, 1).contracts[':TemperatureMonitor'];
}

async function getContract(web3, contractAddress) {
  const address = await getAddress(web3);

  return new web3.eth.Contract(temperatureMonitor.interface, contractAddress, {
    defaultAccount: address,
  });
}

async function deployContract(web3, publicKey) {
  const address = await getAddress(web3);
  const contract = new web3.eth.Contract(temperatureMonitor.interface);
  await web3.eth.personal.unlockAccount(address,'',1000)
  return contract.deploy({
    data: temperatureMonitor.bytecode,
  })
  .send({
    from: address,
    gas: '0x2CD29C0',
    privateFor: [publicKey],
  })
  .then((contract) => {
    return contract.options.address;
  });
}

async function setTemperature(web3, contractAddress, publicKey, temp) {
  const address = await getAddress(web3);
  const myContract = await getContract(web3, contractAddress);

  return myContract.methods.set(temp).send({
    from: address,
    privateFor: [publicKey],
  }).then((receipt) => {
    return receipt.status;
  });
}

async function getTemperature(web3, contractAddress) {
  const myContract = await getContract(web3, contractAddress);
  return myContract.methods.get().call().then(result => result);
}

main()