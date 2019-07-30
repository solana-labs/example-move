# This is a work-in-progress

[![Build status][travis-image]][travis-url]

[travis-image]: https://api.travis-ci.org/solana-labs/example-move.svg?branch=master
[travis-url]: https://travis-ci.org/solana-labs/example-move

# Move on Solana

This project demonstrates how to use the [Solana Javascript API](https://github.com/solana-labs/solana-web3.js)
to build, deploy, and interact with Libra Move programs on the Solana blockchain.

The project comprises:

* Easy program build and deployment using the `@solana/web3.js` library
* Command-line front-end: `src/`

## Getting Started

First fetch the npm dependencies, including `@solana/web3.js`, by running:
```sh
$ npm install
```

### Select a Network
The example connects to a local Solana cluster by default.

To start a local Solana cluster run:
```bash
$ npm run localnet:update
$ npm run localnet:up
```

Solana cluster logs are available with:
```bash
$ npm run localnet:logs
```

For more details on working with a local cluster, see the [full instructions](https://github.com/solana-labs/solana-web3.js#local-network).

Alternatively to connect to the public testnet, `export LIVE=1` in your
environment.  By default `LIVE=1` will connect to the
beta testnet.  To use the edge testnet instead define `export CHANNEL=edge' in
your environment (see [url.js](https://github.com/solana-labs/solana/tree/master/urj.js) for more)

### Run the Command-Line Front End

```sh
$ npm run start
```

## Customizing the Program
To customize, make changes to the files under `/src`

Now when you run `npm run start`, you should see your changes.

To deploy a program with a different name, edit `src/server/config.js`.
