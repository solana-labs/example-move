// @flow

import {Account, PublicKey, Connection, Loader} from '@solana/web3.js';
import * as lo from 'buffer-layout';

// TODO pull from the SDK
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
    return data.chars.toString('utf8');
  };

  rsl.encode = (str, buffer, offset) => {
    const data = {
      chars: Buffer.from(str, 'utf8'),
    };
    return _encode(data, buffer, offset);
  };

  return rsl;
};

/**
 * Libra account type that holds a pre-verified but compiled program
 */
export const LibraAccountTypeCompiledProgram = 1;

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
   * Load a Move program
   *
   * @param connection The connection to use
   * @param owner The account to load the program into
   * @param bytes The entire compiled libra program as a json string
   */
  static load(
    connection: Connection,
    payer: Account,
    bytes: Array<number>,
  ): Promise<PublicKey> {
    const layout = lo.struct([lo.u32('accountType'), rustString('bytes')]);

    const buffer = Buffer.alloc(4 + 8 + bytes.length); // accountType + bytes length + bytes
    layout.encode(
      {accountType: LibraAccountTypeCompiledProgram, bytes},
      buffer,
    );

    const program = new Account();
    return Loader.load(
      connection,
      payer,
      program,
      MoveLoader.programId,
      [...buffer],
    );
  }
}
