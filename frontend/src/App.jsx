import { useState } from "react";
import LandingPage from "./LandingPage.jsx";
import SignIn from "./SignIn.jsx";

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  if (isSignedIn) {
    return <LandingPage />;
  }

  return <SignIn onSignIn={() => setIsSignedIn(true)} />;
}
