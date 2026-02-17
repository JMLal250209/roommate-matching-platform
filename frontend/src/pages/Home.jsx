import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="container">
      <div className="card">
        <div className="cardHeader">
          <h1 className="h1">Find a place. Find your people.</h1>
          <p className="sub">
            One platform for student housing + compatible roommates. Start by telling us what you need.
          </p>
        </div>

        <div className="cardBody">
          <div className="row">
            <Link className="btn btnPrimary" to="/profile/housing">
              Complete your profile
            </Link>
            <button type="button" className="btn btnSecondary">
              Browse properties (soon)
            </button>
          </div>

          <div className="divider"></div>

          <p className="sub" style={{ margin: 0 }}>
            Stress-free by design: you can update preferences anytime, and you’ll always see why a match was suggested.
          </p>
        </div>
      </div>
    </div>
  );
}
