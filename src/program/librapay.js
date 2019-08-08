// @flow

import {
  Account,
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import path from 'path';
import fs from 'mz/fs';
import * as lo from 'buffer-layout';

import {newSystemAccountWithAirdrop} from '../util/new-system-account-with-airdrop';
import * as InstructionData from './instruction_data';
import {sendAndConfirmTransaction} from '../util/send-and-confirm-transaction';
import {MoveLoader} from './move-loader';

const sizeOfGenesisAccount = 5176; // Known size, may change in the future
const sizeOfUserAccount = 2048; // TODO Generous estimate for most user accounts

/**
 * Load a new instance of a Move program on-chain.
 * Returns the new program account.
 */
async function loadProgram(
  connection: Connection,
  path: string,
): Promise<PublicKey> {
  console.log(`Loading program: ${path}`);
  const data = await fs.readFile(path);
  const loaderAccount = await newSystemAccountWithAirdrop(connection, 100000);
  return MoveLoader.load(connection, loaderAccount, data);
}

/**
 * Create a new account owned by the Move loader program.
 * Returns the newly created account.
 */
export async function createAccount(
  connection: Connection,
  payerAccount: Account,
  size: number = sizeOfUserAccount,
): Promise<Account> {
  const newAccount = new Account();
  const transaction = new Transaction();

  transaction.add(
    SystemProgram.createAccount(
      payerAccount.publicKey,
      newAccount.publicKey,
      1,
      size,
      MoveLoader.programId,
    ),
  );

  await sendAndConfirmTransaction(
    `Send CreateGenesis command`,
    connection,
    transaction,
    payerAccount,
    newAccount,
  );

  return newAccount;
}

/**
 * Create and populate a new Libra Genesis account.
 * Returns the new account.
 */
export async function createGenesis(
  connection: Connection,
  payerAccount: Account,
  amount: number,
): Promise<Account> {
  const genesisAccount = await createAccount(
    connection,
    payerAccount,
    sizeOfGenesisAccount,
  );

  const transaction = new Transaction();
  transaction.add({
    keys: [
      {
        pubkey: genesisAccount.publicKey,
        isSigner: true,
        isDebitable: true,
      },
    ],
    programId: MoveLoader.programId,
    data: InstructionData.createGenesis(amount),
  });

  await sendAndConfirmTransaction(
    `Send CreateGenesis Tx`,
    connection,
    transaction,
    payerAccount,
    genesisAccount,
  );

  return genesisAccount;
}

/**
 * Mint tokens into a new Libra account.
 * Returns the new account
 */
export async function mint(
  connection: Connection,
  payerAccount: Account,
  genesisAccount: Account,
  amount: number,
): Promise<Account> {
  const payeeAccount = await createAccount(connection, payerAccount);

  const programPublicKey = await loadProgram(
    connection,
    path.join(__dirname, '../..', 'programs', 'mint_to_address.out'),
  );

  const transaction = new Transaction();
  transaction.add({
    keys: [
      {
        pubkey: programPublicKey,
        isSigner: false,
        isDebitable: false,
      },
      {
        pubkey: genesisAccount.publicKey,
        isSigner: true,
        isDebitable: true,
      },
      {
        pubkey: payeeAccount.publicKey,
        isSigner: true,
        isDebitable: true,
      },
    ],
    programId: MoveLoader.programId,
    data: InstructionData.runMintToAddress(payeeAccount.publicKey, amount),
  });

  await sendAndConfirmTransaction(
    `Run mint_to_address`,
    connection,
    transaction,
    payerAccount,
    genesisAccount,
    payeeAccount,
  );

  return payeeAccount;
}

/**
 * Pay Libras from one account to another
 */
export async function pay(
  connection: Connection,
  payerAccount: Account,
  genesisAccount: Account,
  senderAccount: Account,
  payeeAccount: Account,
  amount: number,
): Promise<void> {
  const programPublicKey = await loadProgram(
    connection,
    path.join(__dirname, '..', '..', 'programs', 'pay_from_sender.out'),
  );

  const transaction = new Transaction();
  transaction.add({
    keys: [
      {
        pubkey: programPublicKey,
        isSigner: false,
        isDebitable: false,
      },
      {
        pubkey: genesisAccount.publicKey,
        isSigner: false,
        isDebitable: true,
      },
      {
        pubkey: senderAccount.publicKey,
        isSigner: true,
        isDebitable: true,
      },
      {
        pubkey: payeeAccount.publicKey,
        isSigner: true,
        isDebitable: true,
      },
    ],
    programId: MoveLoader.programId,
    data: InstructionData.runPayFromSender(
      senderAccount.publicKey,
      payeeAccount.publicKey,
      amount,
    ),
  });

  return sendAndConfirmTransaction(
    `Run pay_from_sender`,
    connection,
    transaction,
    payerAccount,
    genesisAccount,
    senderAccount,
    payeeAccount,
  );
}

/**
 * Gets the Libra balance of an account
 */
export async function getLibraBalance(
  connection: Connection,
  publicKey: PublicKey,
): Promise<number> {
  const layout = lo.struct([
    lo.blob(165, 'ignore'), // This offset may change...
    lo.nu64('balance'),
  ]);

  const accountInfo = await connection.getAccountInfo(publicKey);
  const info = layout.decode(accountInfo.data);
  return info.balance;
}
