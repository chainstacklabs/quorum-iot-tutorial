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
  const contractAddress = await deployContract(raft1Node);
  console.log(`Contract address after deployment: ${contractAddress}`);

  const status = await setTemperature(raft2Node, contractAddress, 10);
  console.log(`Transaction status: ${status}`);

  const temp = await getTemperature(raft3Node, contractAddress);
  console.log('Retrieved contract Temperature', temp);
}

async function getContract(web3, contractAddress) {
  const address = await getAddress(web3);

  return new web3.eth.Contract(temperatureMonitor.interface, contractAddress, {
    defaultAccount: address,
  });
}

function getAddress(web3) {
  return web3.eth.getAccounts().then(accounts => accounts[0]);
}

function formatContract() {
  const source = fs.readFileSync('./temperatureMonitor.sol', 'UTF8');
  return solc.compile(source, 1).contracts[':TemperatureMonitor'];
}

async function deployContract(web3) {
  const address = await getAddress(web3);
  const privKey = process.env.PRIV1
  const contract = new web3.eth.Contract(temperatureMonitor.interface);

  //get encodedABI of contract
  const encodedABI = contract.deploy({
    data:temperatureMonitor.bytecode
  }).encodeABI()
  
  //create txPayload
  let txPayload = {
    from:address,
    data:encodedABI,
    gas:0x2CD29C0,
  }
  //sign txPayload & get the rawTransaction data
  let result = await web3.eth.accounts.signTransaction(txPayload,privKey)
  let rawTx = result.rawTransaction
  
  //send it to the Quorum node
  return web3.eth.sendSignedTransaction(rawTx).then((result) => {
    return result.contractAddress
  })
}

async function setTemperature(web3, contractAddress, temp) {
  const myContract = await getContract(web3, contractAddress);
  const address = await getAddress(web3);
  const privKey = process.env.PRIV2
  //create the encodedABI of function call
  const encodedABI = myContract.methods.set(temp).encodeABI()

  //create txPayload
  let txPayload = {
    from:address,
    to:contractAddress,
    gas:0x2CD29C0,
    data:encodedABI
  }
  //sign txPayload & get the rawTransaction data
  let result = await web3.eth.accounts.signTransaction(txPayload,privKey)
  let rawTx = result.rawTransaction

  //send it to the Quorum node
  return web3.eth.sendSignedTransaction(rawTx).then((result) => {
    return result.status
  })
}

async function getTemperature(web3, contractAddress) {
  const myContract = await getContract(web3, contractAddress);
  const address = await getAddress(web3);
  const privKey = process.env.PRIV3

  return myContract.methods.get().call().then(result => result);
}

main()