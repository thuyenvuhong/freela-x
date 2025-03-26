import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./Message.scss";
import { useAuth } from "../../use-auth-client";
import { FreelaX_backend } from "../../../../declarations/FreelaX_backend";
import { getImageSource } from "../../utils";

const Message = () => {
  const [saving, setSaving] = useState(false);

  const { id } = useParams();
  const { currentUser, principal } = useAuth();

  const queryClient = useQueryClient();

  const { data: conversation } = useQuery({
    queryKey: ["conversations", id],
    queryFn: () => FreelaX_backend.getConversationById(BigInt(id)),
  });

  const { isLoading, error, data } = useQuery({
    queryKey: ["messages", id],
    queryFn: () => FreelaX_backend.getMessages(BigInt(id)),
  });

  const mutation = useMutation({
    mutationFn: (content) => FreelaX_backend.createMessage(BigInt(id), content),
    onSuccess: () => {
      queryClient.invalidateQueries(["messages", id]);
    },
    onError: (e) => console.log(e),
    onSettled: () => setSaving(false),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    mutation.mutate(e.target[0].value);
    e.target[0].value = "";
  };

  const isSeller = currentUser?.isSeller;
  const buyerFullName = conversation?.buyerProfile.fullName;
  const sellerFullName = conversation?.sellerProfile.fullName;
  const avatarUrl = {};
  if (conversation) {
    avatarUrl[conversation.buyer.toString()] = getImageSource(
      conversation.buyerProfile.img
    );
    avatarUrl[conversation.seller.toString()] = getImageSource(
      conversation.sellerProfile.img
    );
  }

  return (
    <div className="message">
      <div className="container">
        <span className="breadcrumbs">
          <Link to="/messages">Messages</Link> {">"}{" "}
          {isSeller ? buyerFullName : sellerFullName} {">"}
        </span>
        {isLoading ? (
          "loading"
        ) : error ? (
          "error"
        ) : (
          <div className="messages">
            {data.map((m) => (
              <div
                className={
                  m.sender.toString() === principal.toString()
                    ? "owner item"
                    : "item"
                }
                key={m.content}
              >
                <img src={avatarUrl[m.sender.toString()]} alt="" />
                <p>{m.content}</p>
              </div>
            ))}
          </div>
        )}
        <hr />
        <form className="write" onSubmit={handleSubmit}>
          <textarea type="text" placeholder="write a message" />
          <button
            type="submit"
            disabled={saving}
            style={{ opacity: saving ? 0.5 : 1 }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Message;
