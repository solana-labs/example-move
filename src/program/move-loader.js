// @flow

import {Account, PublicKey, Connection, Loader} from '@solana/web3.js';
import fs from 'mz/fs';
import * as lo from 'buffer-layout';

import {newSystemAccountWithAirdrop} from '../util/new-system-account-with-airdrop';

export const rustString = (property: string = 'string') => {
  const rsl = lo.struct(
    [
      lo.u32('length'),
      lo.u32('lengthPadding'),
      lo.blob(lo.offset(lo.u32(), -8), 'chars'),
    ],
    property,
  );
  const _decode = rsl.decode.bind(rsl);
  const _encode = rsl.encode.bind(rsl);

  rsl.decode = (buffer, offset) => {
    const data = _decode(buffer, offset);
    return data.chars.toString('ascii');
  };

  rsl.encode = (str, buffer, offset) => {
    const data = {
      chars: Buffer.from(str, 'ascii'),
    };
    return _encode(data, buffer, offset);
  };

  return rsl;
};

/**
 * Libra account type that holds an unverified but compiled Move script or module
 */
/**
 * Solana on-chain Move script or module loader instructions
 */
export const AccountType = {
  CompiledScript: 1, // Write data chunk
  CompiledModule: 2, // Finalize
};

/**
 * Factory class for transactions to interact with a program loader
 */
export class MoveLoader {
  /**
   * Public key that identifies the Move loader
   */
  static get programId(): PublicKey {
    return new PublicKey('MoveLdr111111111111111111111111111111111111');
  }

  /**
   * Minimum number of signatures required to load a program not including
   * retries
   *
   * Can be used to calculate transaction fees
   */
  static getMinNumSignatures(dataLength: number): number {
    return Loader.getMinNumSignatures(dataLength);
  }

  /**
   * Load a Move script/module/program
   *
   * @param connection The connection to use
   * @param accountType Script or module account
   * @param account The account to load into
   * @param path Path of the file to load
   */
  static async load(
    connection: Connection,
    accountType: number,
    account: Account,
    path: string,
  ): Promise<void> {
    const NUM_RETRIES = 500; /* allow some number of retries */

    const bytes = await fs.readFile(path);

    const [, feeCalculator] = await connection.getRecentBlockhash();
    const fees =
      feeCalculator.lamportsPerSignature *
        (MoveLoader.getMinNumSignatures(bytes.length) + NUM_RETRIES) +
      (await connection.getMinimumBalanceForRentExemption(bytes.length));
    const payer = await newSystemAccountWithAirdrop(connection, fees);

    const layout = lo.struct([lo.u32('accountType'), rustString('bytes')]);
    const buffer = Buffer.alloc(4 + 8 + bytes.length); // accountType + bytes length + bytes
    layout.encode({accountType, bytes}, buffer);

    await Loader.load(connection, payer, account, MoveLoader.programId, [
      ...buffer,
    ]);
  }
}
