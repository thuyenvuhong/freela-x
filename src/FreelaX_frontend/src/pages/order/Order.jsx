import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./Order.scss";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FreelaX_backend } from "../../../../declarations/FreelaX_backend";
import { useAuth } from "../../use-auth-client";
import { readFile } from "../../utils";
import { getImageSource } from "../../utils";

const Order = () => {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [file, setFile] = useState(undefined);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const { principal, currentUser } = useAuth();

  const navigate = useNavigate();

  const { isLoading, error, data } = useQuery({
    queryKey: ["orderDeliveries", id],
    queryFn: () => FreelaX_backend.getOrderDeliveries(BigInt(id)),
  });

  const isSeller = currentUser?.isSeller;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const attachment = await readFile(file);
      await FreelaX_backend.deliverOrder({
        orderId: BigInt(id),
        message,
        attachment,
      });
      queryClient.invalidateQueries(["orderDeliveries", id]);
      setMessage("");
      setFile(undefined);
    } catch (err) {
      console.log(err);
    }
    setSaving(false);
  };

  const handleAccept = async () => {
    setSaving(true);
    try {
      await FreelaX_backend.acceptDelivery(BigInt(id));
      navigate("/orders");
    } catch (err) {
      console.log(err);
    }
    setSaving(false);
  };

  return (
    <div className="order">
      {isLoading ? (
        "loading"
      ) : error ? (
        "error"
      ) : (
        <div className="container">
          <div className="title">
            <h1>Order #{id}</h1>
          </div>
          <table>
            <thead>
              <tr>
                <th>Attachment</th>
                <th>Message</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.map((deliver, idx) => (
                <tr key={idx}>
                  <td>
                    <a
                      href={getImageSource(deliver.attachment)}
                      download={"order-" + id + "-attachment"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="download-button">Download File</button>
                    </a>
                  </td>
                  <td>{deliver.message}</td>
                  <td>
                    {new Date(Number(deliver.createdAt) / 1e6).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isSeller ? (
            <>
              <h1>Submit new delivery</h1>
              <div className="sections">
                <div className="info">
                  <label htmlFor="">Message</label>
                  <input
                    type="text"
                    name="title"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                    }}
                  />

                  <div className="images">
                    <div className="imagesInputs">
                      <label htmlFor="">Attachment</label>
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    style={{ opacity: saving ? 0.5 : 1 }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <button
                className="accept"
                onClick={handleAccept}
                disabled={saving}
                style={{ opacity: saving ? 0.5 : 1 }}
              >
                Accept Delivery
              </button>
              <button className="reject">Request Revision</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Order;
