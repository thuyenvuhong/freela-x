import React from "react";
import { Link } from "react-router-dom";
import "./MyGigs.scss";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FreelaX_backend } from "../../../../declarations/FreelaX_backend";
import { getImageSource } from "../../utils";
import { useAuth } from "../../use-auth-client";

function MyGigs() {
  const queryClient = useQueryClient();

  const { principal } = useAuth();

  const { isLoading, error, data } = useQuery({
    queryKey: ["myGigs", principal?.toString()],
    queryFn: () => FreelaX_backend.myGigs(),
    enabled: !!principal,
    initialData: [],
  });

  const mutation = useMutation({
    mutationFn: (id) => {
      return FreelaX_backend.deleteGig(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["myGigs", principal?.toString()]);
    },
    onError: (e) => console.log(e),
  });

  const handleDelete = (id) => {
    mutation.mutate(id);
  };

  return (
    <div className="myGigs">
      {isLoading ? (
        "loading"
      ) : error ? (
        "error"
      ) : (
        <div className="container">
          <div className="title">
            <h1>Gigs</h1>
            {true && (
              <Link to="/add">
                <button>Add New Gig</button>
              </Link>
            )}
          </div>
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Price</th>
                <th>Sales</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((gig) => (
                <tr key={gig.id.toString()}>
                  <td>
                    <img
                      className="image"
                      src={getImageSource(gig.cover)}
                      alt={gig.title}
                    />
                  </td>
                  <td>{gig.title}</td>
                  <td>{gig.price.toString()}</td>
                  <td>{gig.sales.toString()}</td>
                  <td>
                    <img
                      className="delete"
                      src="./img/delete.png"
                      alt="Delete"
                      onClick={() => handleDelete(gig.id)}
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
}

export default MyGigs;
