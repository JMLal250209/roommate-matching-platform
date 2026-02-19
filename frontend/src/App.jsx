// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import SignIn from "./SignIn";
import SignUp from "./SignUp";
import Matches from "./Matches";
import Contact from "./pages/Contact";

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Route not found</h2>
      <p>Try / , /signup , /matches , /contact</p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}