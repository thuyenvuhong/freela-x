import React, { useState, useEffect } from "react";
import "./Balance.scss";
import { useAuth } from "../../use-auth-client";
import { tokenBalance } from "../../utils";
import { icrc1_index_canister } from "../../../../declarations/icrc1_index_canister";
import { useQuery } from "@tanstack/react-query";

function Balance() {
  const [copied, setCopied] = useState(false);

  const { principal } = useAuth();

  const { isLoading: isLoadingBalance, data: balance } = useQuery({
    queryKey: ["balance", principal?.toString()],
    queryFn: () => tokenBalance(principal),
    enabled: !!principal,
  });

  const {
    isLoading: isLoadingTransactions,
    error: errLoadingTransaction,
    data: transactions,
  } = useQuery({
    queryKey: ["transactions", principal?.toString()],
    queryFn: async () => {
      const res = await icrc1_index_canister.get_account_transactions({
        max_results: 10,
        start: [],
        account: { owner: principal, subaccount: [] },
      });
      return res["Ok"]?.transactions
        .filter((t) => t.transaction.kind === "transfer")
        .map((t) => t.transaction.transfer[0]);
    },
    enabled: !!principal,
    initialData: [],
  });

  const amountToString = (amount) => {
    return (Number(amount) / 1e8)
      .toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 8,
      })
      .replace(/\.?0+$/, "");
  };

  const isCurrentUser = function (owner) {
    return owner.toString() === principal?.toString();
  };

  const copyToClipboard = () => {
    if (principal) {
      navigator.clipboard.writeText(principal.toText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset message after 2 seconds
    }
  };

  return (
    <div className="balance">
      <div className="container">
        <div className="title">
          <h1>Balance</h1>
        </div>
        <div className="info">
          <p>
            <strong>Account:</strong>{" "}
            {principal ? (
              <span onClick={copyToClipboard} className="balance-account">
                {principal.toText()}
              </span>
            ) : (
              "Not signed in"
            )}
          </p>
          {copied && <p style={{ color: "green" }}>Copied to clipboard!</p>}
          <p>
            <strong>Balance:</strong>{" "}
            <span className="balance-amount">{amountToString(balance)}</span>
          </p>
        </div>

        <div className="title">
          <h1>Transactions</h1>
        </div>
        {isLoadingTransactions ? (
          "loading"
        ) : errLoadingTransaction ? (
          "error"
        ) : (
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Fee</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, idx) => (
                <tr key={idx}>
                  <td
                    className={
                      isCurrentUser(transaction.from.owner)
                        ? "substracted"
                        : "added"
                    }
                  >
                    {isCurrentUser(transaction.from.owner) ? "-" : "+"}
                    {amountToString(transaction.amount)}
                  </td>
                  <td>{amountToString(transaction.fee)}</td>
                  <td>
                    {isCurrentUser(transaction.from.owner)
                      ? "You"
                      : transaction.from.owner.toString()}
                  </td>
                  <td>
                    {" "}
                    {isCurrentUser(transaction.to.owner)
                      ? "You"
                      : transaction.to.owner.toString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Balance;
