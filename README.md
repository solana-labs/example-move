[![Build status][travis-image]][travis-url]

[travis-image]: https://api.travis-ci.org/solana-labs/example-move.svg?branch=master
[travis-url]: https://travis-ci.org/solana-labs/example-move

# Move on Solana

* **Note: Move on Solana is under construction and therefore this example project is not currently functioning.  Please use it as a learning tool or a reference until construction is complete**

This project demonstrates how to use the [Solana Javascript API](https://github.com/solana-labs/solana-web3.js)
to build, deploy, and interact with Libra Move programs on the Solana blockchain.

There is a wealth of information about Libra and the Move language on the [Libra developers page](https://developers.libra.org/docs/welcome-to-libra)

## What's here

The project comprises of:

* A `LibraPay` library to interact with the on-chain Move loader and virtual machine to create Genesis accounts, and mint and pay Libra coins: [`./src/program`](https://github.com/solana-labs/example-move/tree/master/src/program)
* Move programs used to mint and pay Libra coins: [`./programs`](https://github.com/solana-labs/example-move/tree/master/programs)
* Command-line front-end that demonstrates how to use the `LibraPay` library: [`src/cli/`](https://github.com/solana-labs/example-move/tree/master/src/cli)

## Getting started

First fetch the npm dependencies, including `@solana/web3.js`, by running:

```sh
$ npm install
```

### Select a Network

The example connects to a local Solana cluster by default.

To enable on-chain Move loader/VM logs, set the `RUST_LOG` environment variable:

`$ export RUST_LOG=solana_runtime::native_loader,=warn,solana_runtime::bank=debug,solana_bpf_loader=debug,solana_rbpf=debug`

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
beta testnet.  To use the edge testnet instead, define `export CHANNEL=edge' in
your environment (see [url.js](https://github.com/solana-labs/solana/tree/master/urj.js) for more)

### Run the Command-Line Front End

```sh
$ npm run start
```

## Customizing the Program
To customize, make changes to the files under [`/src`](https://github.com/solana-labs/example-move/tree/master/src)

Now when you run `npm run start` again you should see the results of your changes.
