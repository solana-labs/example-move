/**
 * Example program that demonstrates a variety of Libra Move operations
 *
 * @flow
 */

import assert from 'assert';
import {Connection} from '@solana/web3.js';

import {url, urlTls} from '../../url';
import {
  createAccount,
  createGenesis,
  getLibraBalance,
  mint,
  pay,
} from '../program/librapay';
import {newSystemAccountWithAirdrop} from '../util/new-system-account-with-airdrop';

async function main() {
  const connection = new Connection(url);
  console.log('Using ' + url + ' (' + urlTls + ')');

  const [, feeCalculator] = await connection.getRecentBlockhash();
  const fees = feeCalculator.lamportsPerSignature * 6; // 1 payer + 5 signers
  const payerAccount = await newSystemAccountWithAirdrop(connection, fees);

  const genesis = await createGenesis(connection, payerAccount, 1000000);
  console.log('Genesis: ' + genesis.publicKey.toString());


  const amountToMint = 42;
  console.log('Mint ' + amountToMint + ' libras..');
  const mintedAccount = await mint(
    connection,
    payerAccount,
    genesis,
    amountToMint,
  );
  {
    const balance = await getLibraBalance(connection, mintedAccount.publicKey);
    console.log('Minted: ' + mintedAccount.publicKey.toString() + ' Balance ' + balance);
    assert(balance == amountToMint, 'Wrong number of libras minted!');
  }

  const payeeAccount = await createAccount(connection, payerAccount);
  console.log('Payee: ' + payeeAccount.publicKey.toString());

  const amountToPay = amountToMint / 3;
  console.log('Pay: ' + amountToPay + ' Libras from Minted to Payee');
  await pay(
    connection,
    payerAccount,
    genesis,
    mintedAccount,
    payeeAccount,
    amountToPay,
  );

  {
    const balance = await getLibraBalance(connection, mintedAccount.publicKey);
    console.log('Minted: ' + mintedAccount.publicKey.toString() + ' Balance: ' + balance);
    assert(
      balance == amountToMint - amountToPay,
      'Wrong number of libras left after paying!',
    );
  }
  {
    const balance = await getLibraBalance(connection, payeeAccount.publicKey);
    console.log('Payee: ' + payeeAccount.publicKey.toString() + ' Balance: ' + balance);
    assert(balance == amountToPay, 'Wrong number of libras payed!');
  }

  console.log('Success');
}

main()
  .catch(err => {
    console.error(err);
  })
  .then(() => process.exit());
