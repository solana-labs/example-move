// @flow

import {
  Account,
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import path from 'path';
import * as lo from 'buffer-layout';

import * as InstructionData from './instruction_data';
import {sendAndConfirmTransaction} from '../util/send-and-confirm-transaction';
import {MoveLoader, AccountType} from './move-loader';

const sizeOfGenesisAccount = 9377; // Known size, may change in the future
const sizeOfUserAccount = 2048; // TODO Generous estimate for most user accounts

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
    SystemProgram.createAccount({
      fromPubkey: payerAccount.publicKey,
      newAccountPubkey: newAccount.publicKey,
      lamports: 5000, // enough to cover rent
      space: size,
      programId: MoveLoader.programId,
    }),
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
export async function createGenesisAccount(
  connection: Connection,
  payerAccount: Account,
  microlibras: number,
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
        isWritable: true,
      },
    ],
    programId: MoveLoader.programId,
    data: InstructionData.createGenesis(microlibras),
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
 * Publishes a Move module on-chain
 */
export async function publishModule(
  connection: Connection,
  moduleAccount: Account,
  path: string,
): Promise<void> {
  if (null === await connection.getAccountInfo(moduleAccount.publicKey)) {
    return MoveLoader.load(
      connection,
      AccountType.CompiledModule,
      moduleAccount,
      path,
    );
  }
  console.log('Warning: module already published or account already exists');
}

/**
 * Load a new instance of a Move program on-chain.
 */
export async function loadScript(
  connection: Connection,
  scriptAccount: Account,
  path: string,
): Promise<void> {
  return await MoveLoader.load(
    connection,
    AccountType.CompiledScript,
    scriptAccount,
    path,
  );
}

/**
 * Runs a user script
 */
export async function runScript(
  connection: Connection,
  scriptPublicKey: PublicKey,
  functionName: string,
  payerAccount: Account,
  genesisAccount: Account,
  senderAccount: Account,
  additionalKeys: Array<{
    pubkey: PublicKey,
    isSigner: boolean,
    isWritable: boolean,
  }>,
  additionalSignerAccounts: Array<Account>,
  args: ?Buffer,
): Promise<void> {
  const transaction = new Transaction();
  const keys = [
    {
      pubkey: scriptPublicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: genesisAccount.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: senderAccount.publicKey,
      isSigner: true,
      isWritable: true,
    },
    ...additionalKeys,
  ];

  transaction.add({
    keys,
    programId: MoveLoader.programId,
    data: InstructionData.runScript(
      senderAccount.publicKey,
      functionName,
      args,
    ),
  });

  const signerAccounts = [
    payerAccount,
    senderAccount,
    ...additionalSignerAccounts,
  ];

  await sendAndConfirmTransaction(
    `Run scriptAccount`,
    connection,
    transaction,
    ...signerAccounts,
  );
}

/**
 * Mint tokens into a new Libra account.
 * Returns the new account
 */
export async function mint(
  connection: Connection,
  payerAccount: Account,
  genesisAccount: Account,
  microlibras: number,
): Promise<Account> {
  const payeeAccount = await createAccount(connection, payerAccount);

  let scriptAccount = new Account();
  await loadScript(
    connection,
    scriptAccount,
    path.join(__dirname, '..', '..', 'programs', 'mint_to_address.mv'),
  );

  const transaction = new Transaction();
  transaction.add({
    keys: [
      {
        pubkey: scriptAccount.publicKey,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: genesisAccount.publicKey,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: payeeAccount.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    programId: MoveLoader.programId,
    data: InstructionData.runMintToAddress(payeeAccount.publicKey, microlibras),
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
  microlibras: number,
): Promise<void> {
  let scriptAccount = new Account();
  await loadScript(
    connection,
    scriptAccount,
    path.join(__dirname, '..', '..', 'programs', 'pay_from_sender.mv'),
  );

  const transaction = new Transaction();
  transaction.add({
    keys: [
      {
        pubkey: scriptAccount.publicKey,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: genesisAccount.publicKey,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: senderAccount.publicKey,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: payeeAccount.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    programId: MoveLoader.programId,
    data: InstructionData.runPayFromSender(
      senderAccount.publicKey,
      payeeAccount.publicKey,
      microlibras,
    ),
  });

  return sendAndConfirmTransaction(
    `Run pay_from_senderAccount`,
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
  if (accountInfo === null) {
    throw 'Cannot find libra account';
  }
  const info = layout.decode(accountInfo.data);
  return info.balance;
}
