import React, { useState } from "react";
import "./Gig.scss";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Reviews from "../../components/reviews/Reviews";
import { FreelaX_backend } from "../../../../declarations/FreelaX_backend";
import { getImageSource } from "../../utils";
import { Slider } from "infinite-react-carousel/lib";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { tokenBalance, TRANSFER_FEE, approve } from "../../utils";
import { useAuth } from "../../use-auth-client";

function Gig() {
  const { id } = useParams();

  const [lastError, setLastError] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const { principal } = useAuth();

  const { isLoading, error, data } = useQuery({
    queryKey: ["gigs", id],
    queryFn: () => FreelaX_backend.getGig(BigInt(id)),
  });

  const rating = data ? Number(data.totalStars) / Number(data.starNumber) : 0;

  const creatorId = data?.creator;

  const {
    isLoading: isLoadingUser,
    error: errorUser,
    data: dataUser,
  } = useQuery({
    queryKey: ["users", creatorId?.toString()],
    queryFn: () => FreelaX_backend.getUser(creatorId),
    enabled: !!creatorId,
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await approve(Number(data.price) * 1e8 + TRANSFER_FEE);
      return FreelaX_backend.createOrder(BigInt(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
      navigate("/orders");
    },
    onError: (e) => console.log(e),
    onSettled: () => {
      setSaving(false);
    },
  });

  const handleBuy = async () => {
    setSaving(true);
    const balance = Number(await tokenBalance(principal));
    const amount = Number(data.price) * 1e8;

    if (balance < amount + 2 * TRANSFER_FEE) {
      setLastError("Insufficient balance");
      setSaving(false);
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="gig">
      {isLoading ? (
        "loading"
      ) : error ? (
        "Something went wrong!"
      ) : (
        <div className="container">
          <div className="left">
            <span className="breadcrumbs">
              Fiverr {">"} Graphics & Design {">"}
            </span>
            <h1>{data.title}</h1>
            {isLoadingUser ? (
              "loading"
            ) : errorUser ? (
              "Something went wrong!"
            ) : (
              <div className="user">
                <img className="pp" src={getImageSource(dataUser.img)} alt="" />
                <span>{dataUser.fullName}</span>
                {!isNaN(rating) && (
                  <div className="stars">
                    {Array(Math.round(rating))
                      .fill()
                      .map((item, i) => (
                        <img src="/img/star.png" alt="" key={i} />
                      ))}
                    <span>{rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
            <Slider slidesToShow={1} arrowsScroll={1} className="slider">
              <img src={getImageSource(data.cover)} alt="" />
            </Slider>
            <h2>About This Gig</h2>
            <p>{data.desc}</p>
            {isLoadingUser ? (
              "loading"
            ) : errorUser ? (
              "Something went wrong!"
            ) : (
              <div className="seller">
                <h2>About The Seller</h2>
                <div className="user">
                  <img src={getImageSource(dataUser.img)} alt="" />
                  <div className="info">
                    <span>{dataUser.fullName}</span>
                    {!isNaN(rating) && (
                      <div className="stars">
                        {Array(Math.round(rating))
                          .fill()
                          .map((item, i) => (
                            <img src="/img/star.png" alt="" key={i} />
                          ))}
                        <span>{rating.toFixed(1)}</span>
                      </div>
                    )}
                    <button>Contact Me</button>
                  </div>
                </div>
                <div className="box">
                  <div className="items">
                    <div className="item">
                      <span className="title">From</span>
                      <span className="desc">{dataUser?.country}</span>
                    </div>
                    <div className="item">
                      <span className="title">Member since</span>
                      <span className="desc">Aug 2022</span>
                    </div>
                    <div className="item">
                      <span className="title">Avg. response time</span>
                      <span className="desc">4 hours</span>
                    </div>
                    <div className="item">
                      <span className="title">Last delivery</span>
                      <span className="desc">1 day</span>
                    </div>
                    <div className="item">
                      <span className="title">Languages</span>
                      <span className="desc">English</span>
                    </div>
                  </div>
                  <hr />
                  <p>{dataUser?.desc}</p>
                </div>
              </div>
            )}
            <Reviews gigId={id} />
          </div>
          <div className="right">
            <div className="price">
              <h3>{data.title}</h3>
              <h2>$ {data.price.toString()}</h2>
            </div>
            <div className="details">
              <div className="item">
                <img src="/img/clock.png" alt="" />
                <span>{data.deliveryTime.toString()} Days Delivery</span>
              </div>
              <div className="item">
                <img src="/img/recycle.png" alt="" />
                <span>{data.revisionNumber.toString()} Revisions</span>
              </div>
            </div>
            <div className="features">
              {data.features.map((feature) => (
                <div className="item" key={feature}>
                  <img src="/img/greencheck.png" alt="" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Link onClick={handleBuy} disabled={saving}>
              <button style={{ opacity: saving ? 0.5 : 1 }}>Buy</button>
            </Link>
            {lastError != null && <p className="error-message">{lastError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Gig;
