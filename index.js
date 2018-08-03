/*
 * Blockduino board run-time software.
 *
 * Copyright (C) 2018, Visible Energy Inc. and the Blockduino contributors.
 *
 */

 /*
  * This is the run-time running on the Blockduino board to interact with the public
  * Ethereum blockchain. The application is executing the instructions and commands sent
  * by a contract to interact with the equipment and hardware connected to the board.
  *
  * The Blockduino contract is the dispatcher of commands and instructions for all Blocduino
  * boards. The application listens for RPC events emitted by the Blockduino SDK used by
  * the application contract under the hood. Ownership and and other restrictions for the
  * use of the board are dealt in the Blockduino and application contracts not here.
  * We assume that a RPC received by this application is legitimate. Once the RPC is performed
  * the result is sent as a transaction (using gas from the board account) to the Blockduino
  * contract as dispatcher for the callback in the requesting contract.
  *
  * Current version is for the Raspberry PI and for development and demonstration.
  * It does not provide any protection of the private key used to transact with the
  * blockchain nor for the boot and application itself and it unsafe to use.
  */

var Web3 = require('web3') // ver 1.0 needed 
// util library for transactions
var EthTx = require('ethereumjs-tx')

var ethers = require('ethers');

// Board Ethereum account 
var deviceAddress = "DEVICE_ADDRESS"; // ex. 0x764ef08713193d59163c1cd2c174ac0ce5ee7d5c
var privateKey = "PRIVATE_KEY"; // ex. a7a5ba14aa9ac72f68e1a8210ce8c5fb47c190624180246437e638b76c0fff99";
var privateKeyHex = Buffer.from(privateKey, 'hex');

// Blockduino core contract ABI -- use JSON.stringify(blockduino.abi)
var abi = [{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"getDevice","outputs":[{"name":"","type":"address"},{"name":"","type":"address"},{"name":"","type":"bool"},{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_addr","type":"address"}],"name":"removeDevice","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"getDeviceAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"deviceAddressesCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"FAIL_FLAG","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"requestCnt","outputs":[{"name":"","type":"uint64"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MIN_FEE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"address"},{"name":"_restricted","type":"bool"},{"name":"_mac_s","type":"string"},{"name":"_activaction_key_s","type":"string"}],"name":"addDevice","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"callbackAddr","type":"address"},{"name":"callbackFID","type":"bytes4"},{"name":"_method","type":"uint8"},{"name":"_device","type":"address"},{"name":"_paramsIntegers","type":"uint8[2]"},{"name":"_paramsBytes","type":"bytes32"}],"name":"request","outputs":[{"name":"","type":"int256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"requests","outputs":[{"name":"requester","type":"address"},{"name":"fee","type":"uint256"},{"name":"callbackAddr","type":"address"},{"name":"callbackFID","type":"bytes4"},{"name":"device","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"GAS_PRICE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"unrespondedCnt","outputs":[{"name":"","type":"uint64"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"deviceAddresses","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"requestID","type":"uint64"},{"name":"error","type":"uint64"},{"name":"respData","type":"bytes32"}],"name":"response","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"id","type":"address"}],"name":"NewDevice","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"requestID","type":"uint64"},{"indexed":false,"name":"method","type":"uint8"},{"indexed":true,"name":"device","type":"address"},{"indexed":false,"name":"paramsIntegers","type":"uint8[2]"},{"indexed":false,"name":"paramsBytes","type":"bytes32"}],"name":"RPCRequest","type":"event"}];
//[{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"getDevice","outputs":[{"name":"","type":"address"},{"name":"","type":"address"},{"name":"","type":"bool"},{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_addr","type":"address"}],"name":"removeDevice","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_index","type":"uint256"}],"name":"getDeviceAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"deviceAddressesCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"FAIL_FLAG","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"requestCnt","outputs":[{"name":"","type":"uint64"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MIN_FEE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"address"},{"name":"_restricted","type":"bool"},{"name":"_mac_s","type":"string"},{"name":"_activaction_key_s","type":"string"}],"name":"addDevice","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"callbackAddr","type":"address"},{"name":"callbackFID","type":"bytes4"},{"name":"_method","type":"uint8"},{"name":"_device","type":"address"},{"name":"_paramsIntegers","type":"uint8[2]"},{"name":"_paramsBytes","type":"bytes32"}],"name":"request","outputs":[{"name":"","type":"int256"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"requests","outputs":[{"name":"requester","type":"address"},{"name":"fee","type":"uint256"},{"name":"callbackAddr","type":"address"},{"name":"callbackFID","type":"bytes4"},{"name":"device","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"GAS_PRICE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"unrespondedCnt","outputs":[{"name":"","type":"uint64"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"deviceAddresses","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"requestID","type":"uint64"},{"name":"error","type":"uint64"},{"name":"respData","type":"bytes32"}],"name":"response","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":false,"name":"id","type":"address"}],"name":"NewDevice","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"callbackAddr","type":"address"},{"indexed":false,"name":"method","type":"uint8"},{"indexed":true,"name":"device","type":"address"},{"indexed":false,"name":"paramsIntegers","type":"uint8[2]"},{"indexed":false,"name":"paramsBytes","type":"bytes32"}],"name":"RPCRequest","type":"event"}];

// Blockduino core contract deployment address
var address = '0xc859b2826d7c39a5cca1f651c053523b45aba64f';

// using Websockets
var ws_provider =' wss://ropsten.infura.io/_ws';
const web3 = new Web3(new Web3.providers.WebsocketProvider(ws_provider));

//---- utils for conversion to bytes32
var BN = web3.utils.BN;

function padToBytes32(n) {
    while (n.length < 64) {
        n = "0" + n;
    }
    return "0x" + n;
}
function numStringToBytes32(num) { 
   var bn = new BN(num).toTwos(256);
   return padToBytes32(bn.toString(16));
}
function bytes32ToNumString(bytes32str) {
    bytes32str = bytes32str.replace(/^0x/, '');
    var bn = new BN(bytes32str, 16).fromTwos(256);
    return bn.toString();
}

function web3StringToBytes32(text) {
    var result = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(text));
    while (result.length < 66) { result += '0'; }
    if (result.length !== 66) { throw new Error("invalid web3 implicit bytes32"); }
    return result;
}
//----

// blockduino deployed contract
var deployed =  new web3.eth.Contract(abi, address); 

// obtain once for the board address
async function getOnce(address) {
  try {
    var once = await web3.eth.getTransactionCount(address);
    return once;
  } catch (err) {
    console.log("Error in call getOnce():", err);
    return null;
  }
}

// obtain gas price
async function getGasPrice() {
  var price = await web3.eth.getGasPrice();
  return price;
}

// send a transaction with the response
async function sendResponse(fromAddress, pKeyx, payload) {
  var once = await getOnce(fromAddress);
  var gprice = await getGasPrice();

  var rawTx = {
    nonce: web3.utils.toHex(once),
    gasPrice: web3.utils.toHex(gprice),
    gasLimit: web3.utils.toHex(3000000),
    gas: 100000,
    to: deployed._address,
    from: fromAddress,
    data: payload
  }
  var tx = new EthTx(rawTx);

  console.log("address:", fromAddress);
  console.log("once:", web3.utils.toHex(once));
  console.log("gas price:", gprice);

  // sign and serialize the raw transaction
  tx.sign(pKeyx);
  var txData = tx.serialize().toString('hex');
  console.log(txData)

  // send the signed transaction
  var txReceipt = await web3.eth.sendSignedTransaction(`0x${txData}`, (error, txHash) => {
        if(error) {
          console.log(`ERROR...`, error);
        } else {
          console.log(`TxHash...`);
          console.log(txHash);
        }
  });

  console.log("exiting sendResponse");
  return txReceipt; 
}

/* 
 * Process RPC requests received for the board.
 */ 
function handleRPC(method, paramsIntegers, paramsBytes, requestID) {
	// 	event RPCRequest(address callbackAddr, uint8 method, address indexed device, uint8[2] paramsIntegers, bytes32 paramsBytes);

	console.log("in handleRPC", method, paramsIntegers, paramsBytes, requestID);
	//
	// TODO: execute the RPC method accordingly ...
	// fake a response value
	var error = 1;
	var respData = web3StringToBytes32('aca313fc561edab922705eb03f30aeb8');// 9bb09fd08c00ffd3206f78c3da2ee14c'); // just random bytes for testing
	//var respData = numStringToBytes32('aca313fc561edab922705eb03f30aeb89bb09fd08c00ffd3206f78c3da2ee14c'); // just random bytes for testing
	//var respData = web3.utils.hexToBytes('0xaca313fc561edab922705eb03f30aeb89bb09fd08c00ffd3206f78c3da2ee14c');

	// encode the payload for the RPC response using the ABI for the 'response()' Blockduino core contract function
	var payloadData = deployed.methods.response(requestID, error, respData).encodeABI();

	sendResponse(deviceAddress, privateKeyHex, payloadData)
	  .then(res => {
	    // the transaction has been mined
	    console.log("response txReceipt:", res);
	    return;
	  });

	return;
}

console.log("Starting listener for device: ", deviceAddress);

/*
 * Listen and print Blockduino RPC events issued to a given device.
 */
const newRPCEvent = deployed.events.RPCRequest({filter: {device: deviceAddress}} , function(error, result){
  if (result !== undefined) {
    var args = result.returnValues;
    args["_txn"] = result.transactionHash;
    console.log(args);
    handleRPC(args["method"], args["paramsIntegers"], args["paramsBytes"], args["requestID"]);
  }
});
