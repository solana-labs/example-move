/**
 * Example program that demonstrates a variety of Libra Move operations
 *
 * @flow
 */

import assert from 'assert';
import readline from 'readline-promise';
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
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const connection = new Connection(url);
  rl.write(`Using ${url} (${urlTls})\n`);

  const payerAccount = await newSystemAccountWithAirdrop(connection, 1000);
  const genesis = await createGenesis(connection, payerAccount, 1000000);
  rl.write(`Genesis: ${genesis.publicKey}\n`);

  const amount_to_mint = 42;
  rl.write(`Mint ${amount_to_mint} libras..\n`);
  const mintedAccount = await mint(
    connection,
    payerAccount,
    genesis,
    amount_to_mint,
  );
  {
    const balance = await getLibraBalance(connection, mintedAccount.publicKey);
    rl.write(`Minted: ${mintedAccount.publicKey} Balance: ${balance}\n`);
    assert(balance == amount_to_mint, 'Wrong number of libras minted!');
  }

  const payeeAccount = await createAccount(connection, payerAccount);
  rl.write(`Payee:  ${payeeAccount.publicKey}\n`);

  const amount_to_pay = amount_to_mint / 3;
  rl.write(`Pay ${amount_to_pay} Libras from Minted to Payee\n`);
  await pay(
    connection,
    payerAccount,
    genesis,
    mintedAccount,
    payeeAccount,
    amount_to_pay,
  );

  {
    const balance = await getLibraBalance(connection, mintedAccount.publicKey);
    rl.write(`Minted: ${mintedAccount.publicKey} Balance: ${balance}\n`);
    assert(
      balance == amount_to_mint - amount_to_pay,
      'Wrong number of libras left after paying!',
    );
  }
  {
    const balance = await getLibraBalance(connection, payeeAccount.publicKey);
    rl.write(`Payee:  ${payeeAccount.publicKey} Balance: ${balance}\n`);
    assert(balance == amount_to_pay, 'Wrong number of libras payed!');
  }

  rl.write(`Success!\n`);
}

main()
  .catch(err => {
    console.error(err);
  })
  .then(() => process.exit());
