/**
 * Example program that demonstrates a variety of Libra Move operations
 *
 * @flow
 */

import assert from 'assert';
import {Connection, Account} from '@solana/web3.js';
import path from 'path';
import * as lo from 'buffer-layout';

import {url, urlTls} from '../../url';
import {
  createAccount,
  createGenesisAccount,
  getLibraBalance,
  mint,
  pay,
  publishModule,
  loadScript,
  runScript,
} from '../program/librapay';
import {
  publicKeyLayout,
  TransactionArgument,
} from '../program/instruction_data';
import {newSystemAccountWithAirdrop} from '../util/new-system-account-with-airdrop';

/** Secret key used to publish and import a module
 *
 * Libra requires the module's address when compiling the module and also
 * requires the module address to be referenced by the calling script:
 *   'import 0x1b2f49096e3e5dbd0fcfa9c0c0cd92d9ab3b21544b34d5dd4a65d98b878b9922.M;'
 *
 * To support a since command programmatic example we define the module's secret key.
 * The key is used to publish module here and its derived public key is provided to the
 * compiler when building the module and in the example script.mvir script.
 */
const secretKey = Buffer.from([
  153,
  218,
  149,
  89,
  225,
  94,
  145,
  62,
  233,
  171,
  46,
  83,
  227,
  223,
  173,
  87,
  93,
  163,
  59,
  73,
  190,
  17,
  37,
  187,
  146,
  46,
  51,
  73,
  79,
  73,
  136,
  40,
  27,
  47,
  73,
  9,
  110,
  62,
  93,
  189,
  15,
  207,
  169,
  192,
  192,
  205,
  146,
  217,
  171,
  59,
  33,
  84,
  75,
  52,
  213,
  221,
  74,
  101,
  217,
  139,
  135,
  139,
  153,
  34,
]);

async function main() {
  const connection = new Connection(url, 'recent');
  console.log('Using ' + url + ' (' + urlTls + ')');

  const balance = 1000000000; // Ask for a ton
  const payerAccount = await newSystemAccountWithAirdrop(connection, balance);

  // Create a Libra Genesis account

  const genesisAccount = await createGenesisAccount(
    connection,
    payerAccount,
    100000000,
  );
  console.log('Created genesis ' + genesisAccount.publicKey.toString());

  // Mint some Libras

  const amountToMint = 360;
  console.log('Mint ' + amountToMint + ' microlibras ...');
  const mintedAccount = await mint(
    connection,
    payerAccount,
    genesisAccount,
    amountToMint,
  );
  {
    const balance = await getLibraBalance(connection, mintedAccount.publicKey);
    console.log(
      'Minted ' +
        balance +
        ' microlibras to ' +
        mintedAccount.publicKey.toString(),
    );
    assert(balance == amountToMint, 'Wrong number of Libras minted!');
  }

  // Pay Libras to another account

  const amountToPay = 42;
  const payeeAccount = await createAccount(connection, payerAccount);
  console.log('Pay ' + amountToPay + ' microlibras from Minted Account');
  await pay(
    connection,
    payerAccount,
    genesisAccount,
    mintedAccount,
    payeeAccount,
    amountToPay,
  );

  {
    const balance = await getLibraBalance(connection, mintedAccount.publicKey);
    assert(
      balance == amountToMint - amountToPay,
      'Wrong number of microlibras left after paying!',
    );
  }
  {
    const balance = await getLibraBalance(connection, payeeAccount.publicKey);
    console.log(
      'Payed ' +
        balance +
        ' microlibras to ' +
        payeeAccount.publicKey.toString(),
    );
    assert(balance == amountToPay, 'Wrong number of microlibras payed!');
  }

  // Publish a module with true wisdom

  const modulePath = path.join(__dirname, '..', '..', 'programs', 'module.mv');
  console.log('Publishing module: ' + modulePath);
  let moduleAccount = new Account(secretKey);
  await publishModule(connection, moduleAccount, modulePath);
  console.log('Published module ' + moduleAccount.publicKey.toString());

  // Load a script that pays the amount returned by the module

  const scriptPath = path.join(__dirname, '..', '..', 'programs', 'script.mv');
  console.log('Loading script: ' + scriptPath);
  let scriptAccount = new Account();
  await loadScript(connection, scriptAccount, scriptPath);
  console.log('Loaded script ' + scriptAccount.publicKey.toString());

  // Run that script

  console.log('Running script ' + scriptAccount.publicKey.toString());
  const enlightenedAccount = await createAccount(connection, payerAccount);
  const argsLayout = lo.struct([
    lo.nu64('numArgs'),
    lo.u32('argType'),
    publicKeyLayout('payeeAccountAddress'),
  ]);
  var args = Buffer.alloc(argsLayout.span);
  argsLayout.encode(
    {
      numArgs: 1,
      argType: TransactionArgument.Address,
      payeeAccountAddress: enlightenedAccount.publicKey.toBuffer(),
    },
    args,
  );
  await runScript(
    connection,
    scriptAccount.publicKey,
    'main',
    payerAccount,
    genesisAccount,
    mintedAccount,
    [
      {
        pubkey: moduleAccount.publicKey,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: enlightenedAccount.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    [enlightenedAccount],
    args,
  );

  {
    const balance = await getLibraBalance(
      connection,
      enlightenedAccount.publicKey,
    );
    const universalTruth = 42;
    console.log(
      'Payed ' +
        balance +
        ' microlibras to ' +
        enlightenedAccount.publicKey.toString(),
    );
    assert(balance == universalTruth, 'Not enlightened!');
  }

  console.log('Success');
}

main()
  .catch(err => {
    console.error(err);
  })
  .then(() => process.exit());
