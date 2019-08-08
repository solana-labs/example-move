/**
 * The commands (encoded as Transaction Instructions) that are accepted by the
 * Move loader program
 *
 * @flow
 */

import * as lo from 'buffer-layout';
import {PublicKey} from '@solana/web3.js';

// TODO pull this from the SDK
const publicKeyLayout = (property: string = 'publicKey'): Object => {
  return lo.blob(32, property);
};

/**
 * Solana on-chain Loader Instructions
 */
const Instruction = {
  Write: 0, // Write program data chunk
  Finalize: 1, // Finalize a program
  InvokeMain: 2, // Invoke a program
};

/**
 * Solana on-chain Move Loader commands
 */
const Command = {
  CreateGenesis: 0, // Create genesis account
  RunProgram: 1, // Run a program
};

/**
 * Libra's mint account address is all zeros, structurally equivalent
 * to a Solana public key
 */
export function getMintAddress(): PublicKey {
  return new PublicKey('1111111111111111111111111111111111111111111');
}

/**
 * Returns the instruction data to create a genesis account
 */
export function createGenesis(amount: number): Buffer {
  const layout = lo.struct([
    lo.u32('instruction'),
    lo.nu64('length'),
    lo.u32('command'),
    lo.nu64('amount'),
  ]);

  const buffer = Buffer.alloc(layout.span);
  layout.encode(
    {
      instruction: Instruction.InvokeMain,
      length: 4 + 8, // command + amount
      command: Command.CreateGenesis,
      amount,
    },
    buffer,
  );
  return buffer;
}

/**
 * Returns the instruction data to call mint_to_address Move program
 */
export function runMintToAddress(
  payeeAddress: PublicKey,
  amount: number,
): Buffer {
  const layout = lo.struct([
    lo.u32('instruction'),
    lo.nu64('length'),
    lo.u32('command'),
    publicKeyLayout('senderAddress'),
    lo.nu64('functionNameLength'),
    lo.blob(4, 'functionName'),
    lo.nu64('numArgs'),
    lo.u32('addressType'),
    publicKeyLayout('payeeAddress'),
    lo.u32('valueType'),
    lo.nu64('amount'),
  ]);

  const buffer = Buffer.alloc(layout.span);
  layout.encode(
    {
      instruction: Instruction.InvokeMain,
      length: 104, // length of this specific run program command
      command: Command.RunProgram,
      senderAddress: getMintAddress().toBuffer(),
      functionNameLength: 4,
      functionName: Buffer.from('main', 'utf8'),
      numArgs: 2,
      addressType: 1,
      payeeAddress: payeeAddress.toBuffer(),
      valueType: 0,
      amount,
    },
    buffer,
  );
  return buffer;
}

/**
 * Returns the instruction data to call the pay_from_sender Move program
 */
export function runPayFromSender(
  senderAddress: PublicKey,
  payeeAddress: PublicKey,
  amount: number,
): Buffer {
  const layout = lo.struct([
    lo.u32('instruction'),
    lo.nu64('length'),
    lo.u32('command'),
    publicKeyLayout('senderAddress'),
    lo.nu64('functionNameLength'),
    lo.blob(4, 'functionName'),
    lo.nu64('numArgs'),
    lo.u32('addressType'),
    publicKeyLayout('payeeAddress'),
    lo.u32('valueType'),
    lo.nu64('amount'),
  ]);

  const buffer = Buffer.alloc(layout.span);
  layout.encode(
    {
      instruction: Instruction.InvokeMain,
      length: 104, // length of this specific run program command
      command: Command.RunProgram,
      senderAddress: senderAddress.toBuffer(),
      functionNameLength: 4,
      functionName: Buffer.from('main', 'utf8'),
      numArgs: 2,
      addressType: 1,
      payeeAddress: payeeAddress.toBuffer(),
      valueType: 0,
      amount,
    },
    buffer,
  );
  return buffer;
}
