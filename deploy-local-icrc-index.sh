#!/usr/bin/env bash

dfx deploy icrc1_index_canister --argument '(opt variant { Init = record { ledger_id = principal "mxzaz-hqaaa-aaaar-qaada-cai"; retrieve_blocks_from_ledger_interval_seconds = opt 10; } })'

dfx generate icrc1_index_canister