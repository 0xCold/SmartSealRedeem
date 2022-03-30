import Web3 from "web3"
import { Transaction } from '@ethereumjs/tx'

const WEB3_PROVIDER = 'https://rpc-mumbai.matic.today'

export const getWeb3 = () => {
    return new Web3(new Web3.providers.HttpProvider(WEB3_PROVIDER));
}

export const getAccounts = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts;
}

export const beautifyAddress = (address) => {
    return address.slice(0, 6) + ".." + address.slice(-4);
}  

export const beautifyBalance = (wei, decimals) => {
    let web3 = getWeb3();
    const asEther = parseFloat(web3.utils.fromWei(wei.toString()));
    return asEther.toFixed(decimals);
}  

export const createAndSendSignedTx = async (tx, signers) => {
    const transaction = new Transaction(tx);
    for (let signer of signers) {
        const signerPrivateKey = Buffer.from(signer.privateKey.slice(2), "hex");
        transaction.sign(signerPrivateKey);
    }

    const serializedTx = "0x" + transaction.serialize().toString('hex');

    const txHash = await window.ethereum.request({
        method: 'eth_sendRawTransaction',
        params: [serializedTx],
    });

    return txHash;
}

async function awaitTxResult(txHash) {
    console.log('%cWaiting for transaction to be approved: \n', 'color: purple;');

}
