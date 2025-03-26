import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Orders.scss";
import { useQuery } from "@tanstack/react-query";
import { FreelaX_backend } from "../../../../declarations/FreelaX_backend";
import { useAuth } from "../../use-auth-client";
import { getImageSource } from "../../utils";

const Orders = () => {
  const { principal, currentUser } = useAuth();

  const navigate = useNavigate();

  const { isLoading, error, data } = useQuery({
    queryKey: ["myOrders", principal?.toString()],
    queryFn: () => FreelaX_backend.myOrders(),
    enabled: !!principal,
    initialData: [],
  });

  const handleContact = async (order) => {
    let conversation = (
      await FreelaX_backend.getConversationByParticipants(
        order.buyer,
        order.seller
      )
    )[0];
    if (!conversation) {
      conversation = await FreelaX_backend.createConversation(
        currentUser.isSeller ? order.buyer : order.seller
      );
    }
    navigate(`/message/${conversation.id.toString()}`);
  };

  const isSeller = currentUser?.isSeller;

  return (
    <div className="orders">
      {isLoading ? (
        "loading"
      ) : error ? (
        "error"
      ) : (
        <div className="container">
          <div className="title">
            <h1>Orders</h1>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Title</th>
                <th>Price</th>
                <th>Created</th>
                <th>Status</th>
                <th>{isSeller ? "Buyer" : "Seller"}</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {data.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/order/${order.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td> {order.id.toString()}</td>
                  <td>{order.title}</td>
                  <td>{order.price?.toString()}</td>
                  <td>
                    {new Date(Number(order.createdAt) / 1e6).toLocaleString()}
                  </td>
                  <td>
                    <span
                      style={{
                        color: "purple",
                        fontWeight: "bold",
                      }}
                    >
                      {Object.keys(order.status)[0]}
                    </span>
                  </td>
                  <th>{isSeller ? order.buyerName : order.sellerName}</th>
                  <td>
                    <img
                      className="message"
                      src="/img/message.png"
                      alt="Contact Seller"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContact(order);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
