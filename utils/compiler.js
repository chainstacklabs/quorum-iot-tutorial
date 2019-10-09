const path = require('path');
const fs = require('fs');
const solc = require('solc');

const getConfigTemplate = () => ({
  language: 'Solidity',
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
});

const findImport = name => {
  const contents = fs.readFileSync(
    path.resolve(__dirname, '../contracts', name),
    'utf8',
  );

  return {
    contents,
  };
};

const compileContract = name => {
  const contractPath = path.resolve(__dirname, '../contracts', name);
  const source = fs.readFileSync(contractPath, 'UTF-8');

  const contractSource = getConfigTemplate();
  contractSource.sources = {
    [name]: {
      content: fs.readFileSync(
        path.resolve(__dirname, '../contracts', name),
        'utf8',
      ),
    },
  };

  let contract = JSON.parse(
    solc.compile(JSON.stringify(contractSource), findImport),
  ).contracts[name];

  contract = contract[Object.keys(contract)[0]];

  return {
    interface: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  };
};

module.exports = {
  compileContract,
};