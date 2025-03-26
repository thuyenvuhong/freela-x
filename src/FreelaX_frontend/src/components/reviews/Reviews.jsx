import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import Review from "../review/Review";
import "./Reviews.scss";
import { FreelaX_backend } from "../../../../declarations/FreelaX_backend";

const Reviews = ({ gigId }) => {
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();
  const { isLoading, error, data } = useQuery({
    queryKey: ["reviews", gigId.toString()],
    queryFn: () => FreelaX_backend.getReviews(BigInt(gigId)),
  });

  const mutation = useMutation({
    mutationFn: (review) => {
      return FreelaX_backend.createReview({
        ...review,
        gigId: BigInt(gigId),
        star: BigInt(review.star),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["reviews", gigId.toString()]);
    },
    onError: (e) => console.log(e),
    onSettled: () => setSaving(false),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    const content = e.target[0].value;
    const star = e.target[1].value;
    mutation.mutate({ gigId, content, star });
    e.target[0].value = "";
  };

  return (
    <div className="reviews">
      <h2>Reviews</h2>
      {isLoading
        ? "loading"
        : error
        ? "Something went wrong!"
        : data.map((review) => <Review key={review.content} review={review} />)}
      <div className="add">
        <h3>Add a review</h3>
        <form action="" className="addForm" onSubmit={handleSubmit}>
          <input type="text" placeholder="write your opinion" />
          <select name="" id="">
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
          <button disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Reviews;
