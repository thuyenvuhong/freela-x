import React from "react";
import "./Review.scss";
import { getImageSource } from "../../utils";

const Review = ({ review }) => {
  return (
    <div className="review">
      <div className="user">
        <img
          className="pp"
          src={getImageSource(review.reviewerProfile.img)}
          alt=""
        />
        <div className="info">
          <span>{review.reviewerProfile.fullName}</span>
          <div className="country">
            <span>{review.reviewerProfile.country}</span>
          </div>
        </div>
      </div>
      <div className="stars">
        {Array(Number(review.star))
          .fill()
          .map((item, i) => (
            <img src="/img/star.png" alt="" key={i} />
          ))}
        <span>{Number(review.star)}</span>
      </div>
      <p>{review.content}</p>
      <div className="helpful">
        <span>Helpful?</span>
        <img src="/img/like.png" alt="" />
        <span>Yes</span>
        <img src="/img/dislike.png" alt="" />
        <span>No</span>
      </div>
    </div>
  );
};

export default Review;
