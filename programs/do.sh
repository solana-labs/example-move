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
#     - '$ git checkout v0.0.0'
#     - `$ `./libra/scripts/dev_setup.sh`
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

perform_action() {
    set -e
    case "$1" in
    build)
        if [ -z "$2" ]; then
            echo "Error: Path to the local libra repo is required"
            exit
        fi
        if [ -z "$3" ]; then
            echo "Error: Name of program to build is required"
            exit
        fi
         cargo run --manifest-path="$2"/Cargo.toml -p solana_libra_compiler -- -o "$3".out "$3".mvir
        ;;
    clean)
         rm *.out
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