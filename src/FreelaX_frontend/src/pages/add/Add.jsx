import React, { useEffect, useReducer, useState } from "react";
import "./Add.scss";
import { gigReducer, INITIAL_STATE } from "../../reducers/gigReducer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FreelaX_backend } from "../../../../declarations/FreelaX_backend";
import { readFile } from "../../utils";

const Add = () => {
  const [singleFile, setSingleFile] = useState(undefined);
  const [saving, setSaving] = useState(false);

  const [state, dispatch] = useReducer(gigReducer, INITIAL_STATE);

  const handleChange = (e) => {
    dispatch({
      type: "CHANGE_INPUT",
      payload: { name: e.target.name, value: e.target.value },
    });
  };
  const handleFeature = (e) => {
    e.preventDefault();
    dispatch({
      type: "ADD_FEATURE",
      payload: e.target[0].value,
    });
    e.target[0].value = "";
  };

  const handleUpload = async () => {
    try {
      const cover = await readFile(singleFile);
      dispatch({ type: "ADD_IMAGES", payload: { cover } });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!singleFile) return;
    handleUpload();
  }, [singleFile]);

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (gig) => {
      return FreelaX_backend.createGig({
        ...gig,
        deliveryTime: BigInt(Number(gig.deliveryTime)),
        revisionNumber: BigInt(Number(gig.revisionNumber)),
        price: BigInt(Number(gig.price)),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["myGigs"]);
      navigate("/mygigs");
    },
    onError: (e) => console.log(e),
    onSettled: () => {
      setSaving(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    mutation.mutate(state);
  };

  return (
    <div className="add">
      <div className="container">
        <h1>Add New Gig</h1>
        <div className="sections">
          <div className="info">
            <label htmlFor="">Title</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. I will do something I'm really good at"
              onChange={handleChange}
            />
            <label htmlFor="">Category</label>
            <select name="cat" id="cat" onChange={handleChange}>
              <option value="design">Design</option>
              <option value="web">Web Development</option>
              <option value="animation">Animation</option>
              <option value="music">Music</option>
            </select>
            <div className="images">
              <div className="imagesInputs">
                <label htmlFor="">Cover Image</label>
                <input
                  type="file"
                  onChange={(e) => setSingleFile(e.target.files[0])}
                />
              </div>
            </div>
            <label htmlFor="">Description</label>
            <textarea
              name="desc"
              id=""
              placeholder="Brief descriptions to introduce your service to customers"
              cols="0"
              rows="16"
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="details">
            <label htmlFor="">Delivery Time (e.g. 3 days)</label>
            <input
              type="number"
              min={1}
              name="deliveryTime"
              onChange={handleChange}
            />
            <label htmlFor="">Revision Number</label>
            <input
              type="number"
              min={1}
              name="revisionNumber"
              onChange={handleChange}
            />
            <label htmlFor="">Add Features</label>
            <form action="" className="add" onSubmit={handleFeature}>
              <input type="text" placeholder="e.g. page design" />
              <button type="submit">add</button>
            </form>
            <div className="addedFeatures">
              {state?.features?.map((f) => (
                <div className="item" key={f}>
                  <button
                    onClick={() =>
                      dispatch({ type: "REMOVE_FEATURE", payload: f })
                    }
                  >
                    {f}
                    <span>X</span>
                  </button>
                </div>
              ))}
            </div>
            <label htmlFor="">Price</label>
            <input type="number" min={1} onChange={handleChange} name="price" />
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ opacity: saving ? 0.5 : 1 }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Add;
