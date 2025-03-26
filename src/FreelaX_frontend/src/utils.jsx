import { Principal } from "@dfinity/principal";
import { icrc1_ledger_canister } from "../../declarations/icrc1_ledger_canister";
import { canisterId as backendPrincipal } from "../../declarations/FreelaX_backend";

export const TRANSFER_FEE = 10000;

export async function approve(amount) {
  return await icrc1_ledger_canister.icrc2_approve({
    spender: { owner: Principal.fromText(backendPrincipal), subaccount: [] },
    amount: BigInt(amount),
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    expected_allowance: [],
    expires_at: [],
  });
}

export async function tokenBalance(owner) {
  const balance = await icrc1_ledger_canister.icrc1_balance_of({
    owner,
    subaccount: [],
  });
  return balance;
}

export const readFile = async (file) => {
  let data = Uint8Array.of();
  if (file != null) {
    const stream = file.stream();
    const reader = stream.getReader();
    while (true) {
      const part = await reader.read();
      const chunk = part.value;
      if (chunk == null) {
        break;
      }
      data = concatUint8Arrays(data, chunk);
    }
  }
  return data;
};

const concatUint8Arrays = (left, right) => {
  let temporary = [];
  for (let element of left) {
    temporary.push(element);
  }
  for (let element of right) {
    temporary.push(element);
  }
  return Uint8Array.from(temporary);
};

export function getImageSource(imageData) {
  if (imageData != null) {
    const array = Uint8Array.from(imageData);
    const blob = new Blob([array.buffer], { type: "image/png" });
    return URL.createObjectURL(blob);
  } else {
    return "";
  }
}
