const { compileContract } = require('./utils/compiler.js');
const {
  node1,
  node2,
  node3,
} = require('./utils/environment.js');

let temperatureMonitor = {};

const main = async () => {
  const {interface, bytecode} = compileContract('temperatureMonitor.sol');
  temperatureMonitor = {
    interface,
    bytecode,
  };

  const contractAddress = await deployContract(node1);
  console.log(`Contract address after deployment: ${contractAddress}`);

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
}

function getContract(web3, contractAddress) {
  return new web3.eth.Contract(temperatureMonitor.interface, contractAddress);
}

async function deployContract(node) {
  await node.web3.eth.personal.unlockAccount(node.WALLET_ADDRESS, '', 1000);
  const contract = new node.web3.eth.Contract(temperatureMonitor.interface);

  return contract.deploy({
    data: temperatureMonitor.bytecode,
  })
  .send({
      from: node.WALLET_ADDRESS,
      gas: '0x1dcd6500',
      gasPrice: '0',
  })
  .on('error', console.error)
  .then((newContractInstance) => {
    return newContractInstance.options.address;
  });
}

async function setTemperature({ node, contractAddress, temp }) {
  await node.web3.eth.personal.unlockAccount(node.WALLET_ADDRESS, '', 1000);

  const myContract = getContract(node.web3, contractAddress);

  return myContract.methods.set(temp).send({
    from: node.WALLET_ADDRESS,
  })
  .on('error', console.error)
  .then((receipt) => {
    return receipt.status;
  });
}

async function getTemperature({ node, contractAddress }) {
  const myContract = getContract(node.web3, contractAddress);

  return myContract.methods.get().call().then(result => result);
}

main()