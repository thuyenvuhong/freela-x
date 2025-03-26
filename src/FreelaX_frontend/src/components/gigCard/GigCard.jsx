import React from "react";
import "./GigCard.scss";
import { Link } from "react-router-dom";
import { getImageSource } from "../../utils";
import { FreelaX_backend } from "../../../../declarations/FreelaX_backend";
import { useQuery } from "@tanstack/react-query";

const GigCard = ({ item }) => {
  const {
    isLoading,
    error,
    data: creator,
  } = useQuery({
    queryKey: ["users", item.creator.toString()],
    queryFn: () => FreelaX_backend.getUser(item.creator),
  });

  const rating = Number(item.totalStars) / Number(item.starNumber);

  return (
    <Link to={`/gig/${item.id.toString()}`} className="link">
      <div className="gigCard">
        <img src={getImageSource(item.cover)} alt="" />
        <div className="info">
          {isLoading ? (
            "loading"
          ) : error ? (
            "Something went wrong!"
          ) : (
            <div className="user">
              <img src={getImageSource(creator.img)} alt="" />
              <span>{creator.fullName}</span>
            </div>
          )}
          <p>{item.desc}</p>

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
        <hr />
        <div className="detail">
          <img src="./img/heart.png" alt="" />
          <div className="price">
            <span>STARTING AT</span>
            <h2>{item.price.toString()}</h2>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GigCard;
