import { ethers } from "ethers";
import $ from 'jquery'
import { getWeb3 } from "./web3Util"
import { parsePayload, hexToAscii, hash, xorHashes } from "./helpers"

export const SMARTSEAL_CONTRACT_ADDRESS = "0x469511292497C3C75a0Ca99452dBd30cd8A9bbFD"

export const getContract = async () => {
  let web3 = getWeb3()
  let abi = await $.getJSON("contract_abis/SmartSeal.json")
  let contract = new web3.eth.Contract(abi, SMARTSEAL_CONTRACT_ADDRESS)
  return contract
}

export const deriveClaimerPrivateKey = async (payload, pin) => {
  const parsedPayload = parsePayload(payload)
  const pinHash = hexToAscii(await hash(pin))
  const privateKey = xorHashes(parsedPayload, pinHash)
  return privateKey
}

export const getAllSeals = async () => {
  let contract = await getContract()

  const numSeals = await contract.methods.totalSealSupply().call()

  let seals = [];
  for (let id = 1; id <= numSeals; id++) {
    const seal = await contract.methods.idToSealInfo(id).call()
    seals.push(seal)
  }
  return seals
}

export const getSealsByUser = async (user) => {
  const contract = await getContract()

  const balance = await contract.methods.balanceOf(user).call(); 
  
  let seals = [];
  for (let i = 0; i < balance; i++) {
    const id = await contract.methods.tokenOfOwnerByIndex(user, i).call(); 
    const seal = await contract.methods.idToSealInfo(id).call(); 
    seals.push(seal)
  }
  return seals;
}

export const flipPausedStatus = async (user) => {
  let contract = await getContract()
  let web3 = getWeb3()

  const nonce = await web3.eth.getTransactionCount(user);

  const flipPausedStatusInstruction = contract.methods
    .pauseContract()
    .encodeABI();  

  const flipPausedStatusTx = {
    chainId: 80001,
    nonce: web3.utils.toHex(nonce),
    gasLimit: web3.utils.toHex(500000),
    gasPrice: web3.utils.toHex(10000000000),
    value: 0,
    to: contract._address,
    from: user,
    data: flipPausedStatusInstruction
  };

  await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [flipPausedStatusTx],
  });
}
  
export const createSeal = async (user, claimerAddress, uri) => {
  let contract = await getContract()
  let web3 = getWeb3()

  const payerNonce = await web3.eth.getTransactionCount(user);

  const createSealInstruction = contract.methods
    .createSeal(
      claimerAddress,
      uri
    )
    .encodeABI();  

  const createSealTx = {
    chainId: 80001,
    nonce: web3.utils.toHex(payerNonce),
    gasLimit: web3.utils.toHex(500000),
    gasPrice: web3.utils.toHex(10000000000),
    value: 0,
    to: contract._address,
    from: user,
    data: createSealInstruction
  };

  await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [createSealTx],
  });
}

export const redeemSeal = async (user, pin, payload) => {
  let contract = await getContract()
  let web3 = getWeb3()

  const payerBalance = Number(await web3.eth.getBalance(user))
  if (payerBalance === 0) {
    console.log('%cERROR: You must possess some Matic to cover gas fees.', 'color: red;')
    return -1
  } 

  const claimerPrivateKey = await deriveClaimerPrivateKey(payload, pin);
  const claimer = web3.eth.accounts.privateKeyToAccount(claimerPrivateKey)

  const sealId = await contract.methods.authorityToId(claimer.address).call()
  const sealInfo = await contract.methods.idToSealInfo(sealId).call()

  if (sealInfo.id === 0) {
    console.log('%cERROR: The provided PIN did not produce a valid account.', 'color: red;')
    return -1
  } 
  else if (sealInfo.claimed) {
    console.log('%cERROR: This NFT has already been redeemed.', 'color: red;')
    return -1
  } 

  const messageHash = ethers.utils.solidityKeccak256(
    ["uint", "address"],
    [sealId, user]
  );
  let signature = web3.eth.accounts.sign(messageHash, claimerPrivateKey).signature;
  console.log(signature)

  const nonce = await web3.eth.getTransactionCount(user)
  
  const redeemSealInstruction = contract.methods
    .redeemSeal(
      sealId,
      signature
    )
    .encodeABI()

  const redeemSealTx = {
    chainId: 80001,
    nonce: web3.utils.toHex(nonce),
    gasLimit: web3.utils.toHex(500000),
    gasPrice: web3.utils.toHex(10000000000),
    value: 0,
    to: contract._address,
    from: user,
    data: redeemSealInstruction
  }

  await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [redeemSealTx],
  });
}