/**
 * Implements the command-line based game interface
 *
 * @flow
 */
import readline from 'readline-promise';

import {sleep} from '../util/sleep';

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  rl.write(`Run a move program ...\n`);

  // TODO
}

main()
  .catch(err => {
    console.error(err);
  })
  .then(() => process.exit());
