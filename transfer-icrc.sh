#!/bin/bash

# Usage: ./transfer.sh <principal> [amount]

# Check if the required principal argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <principal> [amount]"
    exit 1
fi

PRINCIPAL=$1
DEFAULT_AMOUNT=1_000_000_000  # 10 tokens
AMOUNT=${2:-$DEFAULT_AMOUNT}  # Use the second argument if provided, otherwise use the default

# Run the dfx command with the provided principal and amount
dfx canister call icrc1_ledger_canister icrc1_transfer \
"(record { to = record { owner = principal \"$PRINCIPAL\";}; amount = $AMOUNT;})"
