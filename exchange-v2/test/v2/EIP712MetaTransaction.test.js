const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
//const TestContract = artifacts.require("ExchangeV2.sol");
const ExchangeSimpleV2 = artifacts.require("ExchangeSimpleV2.sol");
const ExchangeSimpleV2_MetaTx = artifacts.require("ExchangeSimpleV2_MetaTx.sol");
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const LibTestContract = artifacts.require("LibEIP712MetaTransaction.sol");

const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const TestERC20 = artifacts.require("TestERC20.sol");

const web3Abi = require('web3-eth-abi');
const sigUtil = require('eth-sig-util');
const { Order, Asset, sign } = require("../order");
const { ETH, ERC20, ERC721, ERC1155, enc, id } = require("../assets");
const { expectThrow } = require("@daonomic/tests-common");
const truffleAssert = require('truffle-assertions');

const ZERO = "0x0000000000000000000000000000000000000000";
let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
let publicKey = "0x726cDa2Ac26CeE89F645e55b78167203cAE5410E";
let privateKey = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2fa6";

let executeMetaTransactionABI = {
    "inputs": [{
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
    }, {
        "internalType": "bytes",
        "name": "functionSignature",
        "type": "bytes"
    }, {
        "internalType": "bytes32",
        "name": "sigR",
        "type": "bytes32"
    }, {
        "internalType": "bytes32",
        "name": "sigS",
        "type": "bytes32"
    }, {
        "internalType": "uint8",
        "name": "sigV",
        "type": "uint8"
    }],
    "name": "executeMetaTransaction",
    "outputs": [{
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
    }],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
};

let matchOrdersAbi = {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "maker",
            "type": "address"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "bytes4",
                    "name": "assetClass",
                    "type": "bytes4"
                  },
                  {
                    "internalType": "bytes",
                    "name": "data",
                    "type": "bytes"
                  }
                ],
                "internalType": "struct LibAsset.AssetType",
                "name": "assetType",
                "type": "tuple"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct LibAsset.Asset",
            "name": "makeAsset",
            "type": "tuple"
          },
          {
            "internalType": "address",
            "name": "taker",
            "type": "address"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "bytes4",
                    "name": "assetClass",
                    "type": "bytes4"
                  },
                  {
                    "internalType": "bytes",
                    "name": "data",
                    "type": "bytes"
                  }
                ],
                "internalType": "struct LibAsset.AssetType",
                "name": "assetType",
                "type": "tuple"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct LibAsset.Asset",
            "name": "takeAsset",
            "type": "tuple"
          },
          {
            "internalType": "uint256",
            "name": "salt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "start",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "end",
            "type": "uint256"
          },
          {
            "internalType": "bytes4",
            "name": "dataType",
            "type": "bytes4"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "internalType": "struct LibOrder.Order",
        "name": "orderLeft",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "signatureLeft",
        "type": "bytes"
      },
      {
        "components": [
          {
            "internalType": "address",
            "name": "maker",
            "type": "address"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "bytes4",
                    "name": "assetClass",
                    "type": "bytes4"
                  },
                  {
                    "internalType": "bytes",
                    "name": "data",
                    "type": "bytes"
                  }
                ],
                "internalType": "struct LibAsset.AssetType",
                "name": "assetType",
                "type": "tuple"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct LibAsset.Asset",
            "name": "makeAsset",
            "type": "tuple"
          },
          {
            "internalType": "address",
            "name": "taker",
            "type": "address"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "bytes4",
                    "name": "assetClass",
                    "type": "bytes4"
                  },
                  {
                    "internalType": "bytes",
                    "name": "data",
                    "type": "bytes"
                  }
                ],
                "internalType": "struct LibAsset.AssetType",
                "name": "assetType",
                "type": "tuple"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct LibAsset.Asset",
            "name": "takeAsset",
            "type": "tuple"
          },
          {
            "internalType": "uint256",
            "name": "salt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "start",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "end",
            "type": "uint256"
          },
          {
            "internalType": "bytes4",
            "name": "dataType",
            "type": "bytes4"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "internalType": "struct LibOrder.Order",
        "name": "orderRight",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "signatureRight",
        "type": "bytes"
      }
    ],
    "name": "matchOrders",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function",
    "payable": true
};

let cancelAbi = {
   "inputs": [
     {
       "components": [
         {
           "internalType": "address",
           "name": "maker",
           "type": "address"
         },
         {
           "components": [
             {
               "components": [
                 {
                   "internalType": "bytes4",
                   "name": "assetClass",
                   "type": "bytes4"
                 },
                 {
                   "internalType": "bytes",
                   "name": "data",
                   "type": "bytes"
                 }
               ],
               "internalType": "struct LibAsset.AssetType",
               "name": "assetType",
               "type": "tuple"
             },
             {
               "internalType": "uint256",
               "name": "value",
               "type": "uint256"
             }
           ],
           "internalType": "struct LibAsset.Asset",
           "name": "makeAsset",
           "type": "tuple"
         },
         {
           "internalType": "address",
           "name": "taker",
           "type": "address"
         },
         {
           "components": [
             {
               "components": [
                 {
                   "internalType": "bytes4",
                   "name": "assetClass",
                   "type": "bytes4"
                 },
                 {
                   "internalType": "bytes",
                   "name": "data",
                   "type": "bytes"
                 }
               ],
               "internalType": "struct LibAsset.AssetType",
               "name": "assetType",
               "type": "tuple"
             },
             {
               "internalType": "uint256",
               "name": "value",
               "type": "uint256"
             }
           ],
           "internalType": "struct LibAsset.Asset",
           "name": "takeAsset",
           "type": "tuple"
         },
         {
           "internalType": "uint256",
           "name": "salt",
           "type": "uint256"
         },
         {
           "internalType": "uint256",
           "name": "start",
           "type": "uint256"
         },
         {
           "internalType": "uint256",
           "name": "end",
           "type": "uint256"
         },
         {
           "internalType": "bytes4",
           "name": "dataType",
           "type": "bytes4"
         },
         {
           "internalType": "bytes",
           "name": "data",
           "type": "bytes"
         }
       ],
       "internalType": "struct LibOrder.Order",
       "name": "order",
       "type": "tuple"
     }
   ],
   "name": "cancel",
   "outputs": [],
   "stateMutability": "nonpayable",
   "type": "function"
};

let quoteToBeSet = "Divya";

const domainType = [{
    name: "name",
    type: "string"
  },
  {
    name: "version",
    type: "string"
  },
  {
    name: "chainId",
    type: "uint256"
  },
  {
    name: "verifyingContract",
    type: "address"
  }
];

const metaTransactionType = [{
    name: "nonce",
    type: "uint256"
  },
  {
    name: "from",
    type: "address"
  },
  {
    name: "functionSignature",
    type: "bytes"
  }
];

let domainData;

const getTransactionData = async (nonce, abi, params) => {
  const functionSignature = web3Abi.encodeFunctionCall(
    abi,
    params
  );

  let message = {};
  message.nonce = parseInt(nonce);
  message.from = publicKey;
  message.functionSignature = functionSignature;
  const dataToSign = {
    types: {
      EIP712Domain: domainType,
      MetaTransaction: metaTransactionType
    },
    domain: domainData,
    primaryType: "MetaTransaction",
    message: message
  };
  const signature = sigUtil.signTypedData_v4(new Buffer(privateKey.substring(2, 66), 'hex'), {
    data: dataToSign
  });
//    console.log("test:"+sigUtil.recoverTypedSignature_v4({sig:signature, data:dataToSign}) ); for test only
  let r = signature.slice(0, 66);
  let s = "0x".concat(signature.slice(66, 130));
  let v = "0x".concat(signature.slice(130, 132));
  v = web3.utils.hexToNumber(v);
  if (![27, 28].includes(v)) v += 27;

  return {r, s, v, functionSignature};
}

contract("EIP712MetaTransaction", function ([_, owner, account1]) {
  let testContract
  let testContractSimple;
  let transferProxy;
  let erc20TransferProxy;
  let t1;
  let t2;
  let community = account1;
  let left;
  let right;

  before('before', async function () {
    transferProxy = await TransferProxyTest.new();
    erc20TransferProxy = await ERC20TransferProxyTest.new();
    royaltiesRegistry = await TestRoyaltiesRegistry.new();
    testContract = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
    testingSimpleContract = await deployProxy(ExchangeSimpleV2, [transferProxy.address, erc20TransferProxy.address], { initializer: "__ExchangeSimpleV2_init" });
    t1 = await TestERC20.new();
    t2 = await TestERC20.new();

    domainData = {
      name: "ExchangeV2",
      version: "1",
      verifyingContract: testContract.address,
      chainId: 1337
    };

    await t1.mint(owner, 100);
    await t1.approve(erc20TransferProxy.address, 10000000, { from: owner });
    left = Order(publicKey, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
    right = Order(owner, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
  });

  describe("Check Methods", function () {
  	it("upgrade, which use MetaTransaction  works", async () => {
  		const wrapper = await ExchangeSimpleV2_MetaTx.at(testingSimpleContract.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(testingSimpleContract.address, ExchangeSimpleV2_MetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  	});

    it("Should be able to send transaction successfully, and check Event, that emit from method, execute as MetaTx", async () => {
      let nonce = await testContract.getNonce(publicKey);

      let {
        r,
        s,
        v,
        functionSignature
      } = await getTransactionData(nonce, cancelAbi, [left]);

      let sendTransactionData = web3Abi.encodeFunctionCall(
        executeMetaTransactionABI,
        [publicKey, functionSignature, r, s, v]
      );
//        Way №1 call transaction
//        await testContract.sendTransaction({
//            value: 0,
//            from: owner,
//            gas: 500000,
//            data: sendTransactionData
//        });
//        Way №2 call transaction
      let resultExecMataTx  = await testContract.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: owner});
      let orderMakerAddress;
      truffleAssert.eventEmitted(resultExecMataTx, 'Cancel', (ev) => {
       	orderMakerAddress = ev.maker;
        return true;
      });
      console.log("orderMakerAddress:"+orderMakerAddress);
      var newNonce = await testContract.getNonce(publicKey);
      assert.isTrue(newNonce.toNumber() == nonce + 1, "Nonce not incremented");
      assert.equal(orderMakerAddress, publicKey);
      //NB! check orderMakerAddress == _msgSender() inside method with cancelAbi, so _msgSender() - also correct
    });

    it("Check Event MetaTransactionExecuted", async () => {
      let nonce = await testContract.getNonce(publicKey);

      let {
        r,
        s,
        v,
        functionSignature
      } = await getTransactionData(nonce, cancelAbi, [left]);

      let sendTransactionData = web3Abi.encodeFunctionCall(
        executeMetaTransactionABI,
        [publicKey, functionSignature, r, s, v]
      );
      let resultExecMataTx  = await testContract.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: owner});

      let userAddress;
      truffleAssert.eventEmitted(resultExecMataTx, 'MetaTransactionExecuted', (ev) => {
     	  userAddress = ev.relayerAddress;
        return true;
      });
      assert.equal(userAddress, owner);
    });

    it("Call the contract method directly", async() => {
      var oldNonce = await testContract.getNonce(publicKey);
      let sendTransactionData = web3Abi.encodeFunctionCall(
        cancelAbi, [right]
      );

      await testContract.sendTransaction({
        value: 0,
        from: owner,
        gas: 500000,
        data: sendTransactionData
      });

      var newNonce = await testContract.getNonce(publicKey);
      assert.isTrue(newNonce.toNumber() == oldNonce.toNumber(), "Nonce are not same");
    })

    it("Should fail when try to call executeMetaTransaction method itself", async () => {
      let nonce = await testContract.getNonce(publicKey, {
        from: owner
      });
      let setQuoteData = await getTransactionData(nonce, cancelAbi, [left]);
      let {r, s, v, functionSignature} = await getTransactionData(nonce,
        executeMetaTransactionABI,
        [publicKey, setQuoteData.functionSignature, setQuoteData.r, setQuoteData.s, setQuoteData.v])
      const sendTransactionData = web3Abi.encodeFunctionCall(
        executeMetaTransactionABI,
        [publicKey, functionSignature, r, s, v]
      );

      try {
        await testContract.sendTransaction({
          value: 0,
          from: owner,
          gas: 500000,
          data: sendTransactionData
        });
      } catch (error) {
        assert.isTrue(error.message.includes("functionSignature can not be of executeMetaTransaction method"), `Wrong failure type`);
      }
    });

    it("Should fail when replay transaction", async () => {
      let nonce = await testContract.getNonce(publicKey, {
          from: owner
      });
      let {
          r,
          s,
          v,
          functionSignature
      } = await getTransactionData(nonce, cancelAbi, [left]);

      const sendTransactionData = web3Abi.encodeFunctionCall(
          executeMetaTransactionABI,
          [publicKey, functionSignature, r, s, v]
      );

      await testContract.sendTransaction({
          value: 0,
          from: owner,
          gas: 500000,
          data: sendTransactionData
      });

      try {
          await testContract.sendTransaction({
              value: 0,
              from: owner,
              gas: 500000,
              data: sendTransactionData
          });
      } catch (error) {
          assert.isTrue(error.message.includes("Signer and signature do not match"), `Wrong failure type`);
      }
    });

    it("Should fail when user address is Zero", async () => {
      let nonce = await testContract.getNonce(publicKey, {
          from: owner
      });
      let {
          r,
          s,
          v,
          functionSignature
      } = await getTransactionData(nonce, cancelAbi, [left]);

      const sendTransactionData = web3Abi.encodeFunctionCall(
          executeMetaTransactionABI,
          [ZERO_ADDRESS, functionSignature, r, s, v]
      );

      try {
          await testContract.sendTransaction({
              value: 0,
              from: owner,
              gas: 500000,
              data: sendTransactionData
          });
      } catch (error) {
          assert.isTrue(error.message.includes("Signer and signature do not match"), `Wrong failure type`);
      }
    });

    it("Should be failed - Signer and Signature do not match", async () => {
      let nonce = await testContract.getNonce(publicKey, {
          from: owner
      });
      let {
          r,
          s,
          v,
          functionSignature
      } = await getTransactionData(nonce, cancelAbi, [left]);

      const sendTransactionData = web3Abi.encodeFunctionCall(
          executeMetaTransactionABI,
          [account1, functionSignature, r, s, v]
      );

      try {
          await testContract.sendTransaction({
              value: 0,
              from: owner,
              gas: 500000,
              data: sendTransactionData
          });
      } catch (error) {
          assert.isTrue(error.message.includes("Signer and signature do not match"), `Wrong failure type`);
      }
    });
  });
});
