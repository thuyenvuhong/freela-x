import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Messages.scss";
import moment from "moment";
import { useAuth } from "../../use-auth-client";
import { FreelaX_backend } from "../../../../declarations/FreelaX_backend";

const Messages = () => {
  const [saving, setSaving] = useState(false);
  const { currentUser, principal } = useAuth();

  const queryClient = useQueryClient();

  const { isLoading, error, data } = useQuery({
    queryKey: ["myConversations", principal?.toString()],
    queryFn: () => FreelaX_backend.myConversations(),
    enabled: !!principal,
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: (id) => FreelaX_backend.readConversation(BigInt(id)),
    onSuccess: () => {
      queryClient.invalidateQueries(["myConversations", principal?.toString()]);
    },
    onError: (e) => console.log(e),
    onSettled: () => setSaving(false),
  });

  const handleRead = (id) => {
    setSaving(true);
    mutation.mutate(id);
  };

  const isSeller = currentUser?.isSeller;

  return (
    <div className="messages">
      {isLoading ? (
        "loading"
      ) : error ? (
        "error"
      ) : (
        <div className="container">
          <div className="title">
            <h1>Messages</h1>
          </div>
          <table>
            <thead>
              <tr>
                <th>{isSeller ? "Buyer" : "Seller"}</th>
                <th>Last Message</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map(
                ({
                  id,
                  buyer,
                  seller,
                  lastMessage,
                  updatedAt,
                  readBySeller,
                  readByBuyer,
                  buyerProfile,
                  sellerProfile,
                }) => {
                  const isUnread =
                    (isSeller && !readBySeller) || (!isSeller && !readByBuyer);
                  const counterpart = isSeller
                    ? buyerProfile.fullName
                    : sellerProfile.fullName;

                  return (
                    <tr key={id} className={isUnread ? "active" : ""}>
                      <td>{counterpart}</td>
                      <td>
                        <Link to={`/message/${id}`} className="link">
                          {lastMessage[0]?.content?.substring(0, 100)}...
                        </Link>
                      </td>
                      <td>{moment(updatedAt).fromNow()}</td>
                      <td>
                        {isUnread && (
                          <button
                            onClick={() => handleRead(id)}
                            disabled={saving}
                            style={{ opacity: saving ? 0.5 : 1 }}
                          >
                            Mark as Read
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Messages;
