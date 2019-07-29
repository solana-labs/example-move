/**
 * Implements the command-line based game interface
 *
 * @flow
 */
import readline from 'readline-promise';
// import {SSL_OP_EPHEMERAL_RSA} from 'constants';

import {sleep} from '../util/sleep';

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  rl.write(`Run a move program ...\n`);

  for (;;) {
    // TODO
    await sleep(250);
  }
}

main()
  .catch(err => {
    console.error(err);
  })
  .then(() => process.exit());
