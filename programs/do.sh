#!/usr/bin/env bash

# Thi script enables the building of Libra Move programs using the Libra Move IR compiler
# built from the Solana Libra Github repo.
#
# Libra Move program source files are text files with the `.mvir` extension.  This script
# compiles these files into the json representations of the libra `transaction::Program` data
# structure which can then be loaded into on-chain program accounts.
#
# Dependencies:
#   - The Solana Libra repo must be cloned and the rust development environment setup
#     - `$ git clone https://github.com/solana-labs/libra.git`
#     - '$ cd libra'
#     - '$ git co solana-0.0.1'
#     - `$ `./scripts/dev_setup.sh`
#
# Examples:
#  - `$ ./do.sh build ../../libra mint_to_address`
#  - `$ ./do.sh clean`

cd "$(dirname "$0")"

usage() {
    cat <<EOF

Usage: do.sh action

Supported actions:
    build <path to libra repo> <name of the program to build>
    clean

EOF
}

libra_path=../../solana-libra
libra_compiler="cargo run --manifest-path="$libra_path/Cargo.toml" -p solana_libra_compiler --"


perform_action() {
    set -e
    case "$1" in
    build)
        eval "$libra_compiler" mint_to_address.mvir
        eval "$libra_compiler" pay_from_sender.mvir

        eval "$libra_compiler" --address 1b2f49096e3e5dbd0fcfa9c0c0cd92d9ab3b21544b34d5dd4a65d98b878b9922 --module module.mvir
        module=`cat module.mv`
        re='{"code":(.*)}'
        if [[ $module =~ $re ]]; then
            echo "[${BASH_REMATCH[1]}]" > deps.json
        else
            echo "Failed to match module bytes"
            exit
        fi
        eval "$libra_compiler" --deps deps.json script.mvir
        ;;
    clean)
         rm *.mv
         rm *.json
        ;;
    help)
        usage
        exit
        ;;
    *)
        echo "Error: Unknown command"
        usage
        exit
        ;;
    esac
}

set -e
perform_action "$1" "$2" "$3"
