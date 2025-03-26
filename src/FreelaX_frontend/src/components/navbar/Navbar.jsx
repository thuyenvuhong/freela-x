import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.scss";
import { useAuth } from "../../use-auth-client";
import { getImageSource } from "../../utils";

function Navbar() {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);

  const { pathname } = useLocation();

  const { isAuthenticated, login, logout, currentUser } = useAuth();

  const isActive = () => {
    window.scrollY > 0 ? setActive(true) : setActive(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", isActive);
    return () => {
      window.removeEventListener("scroll", isActive);
    };
  }, []);

  return (
    <div className={active || pathname !== "/" ? "navbar active" : "navbar"}>
      <div className="container">
        <div className="logo">
          <Link className="link" to="/">
            <span className="text">FreelaX</span>
          </Link>
          <span className="dot">.</span>
        </div>
        <div className="links">
          <span>FreelaX Business</span>
          <span>Explore</span>
          <span>English</span>
          {isAuthenticated ? (
            currentUser ? (
              <div className="user" onClick={() => setOpen(!open)}>
                <img src={getImageSource(currentUser?.img)} alt="" />
                <span>{currentUser?.fullName}</span>
                {open && (
                  <div className="options">
                    {currentUser.isSeller && (
                      <>
                        <Link className="link" to="/mygigs">
                          Gigs
                        </Link>
                        <Link className="link" to="/add">
                          Add New Gig
                        </Link>
                      </>
                    )}
                    <Link className="link" to="/orders">
                      Orders
                    </Link>
                    <Link className="link" to="/messages">
                      Messages
                    </Link>
                    <Link className="link" to="/balance">
                      Balance
                    </Link>
                    <Link className="link" onClick={logout}>
                      Logout
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link className="link" to="/register">
                  <button>Become an user</button>
                </Link>
              </>
            )
          ) : (
            <>
              <Link className="link" onClick={login}>
                <button>Sign in</button>
              </Link>
            </>
          )}
        </div>
      </div>
      {(active || pathname !== "/") && (
        <>
          <hr />
          <div className="menu">
            <Link className="link menuLink" to="/">
              Graphics & Design
            </Link>
            <Link className="link menuLink" to="/">
              Video & Animation
            </Link>
            <Link className="link menuLink" to="/">
              Writing & Translation
            </Link>
            <Link className="link menuLink" to="/">
              AI Services
            </Link>
            <Link className="link menuLink" to="/">
              Digital Marketing
            </Link>
            <Link className="link menuLink" to="/">
              Music & Audio
            </Link>
            <Link className="link menuLink" to="/">
              Programming & Tech
            </Link>
            <Link className="link menuLink" to="/">
              Business
            </Link>
            <Link className="link menuLink" to="/">
              Lifestyle
            </Link>
          </div>
          <hr />
        </>
      )}
    </div>
  );
}

export default Navbar;
