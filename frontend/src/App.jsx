import { useState } from "react";
import LandingPage from "./LandingPage.jsx";
import PropertyDetails from "./pages/details.jsx";

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  if (isSignedIn) {
    return <LandingPage onSelectProperty={() => setIsSignedIn(false)} />;
  }

  return <PropertyDetails onBack={() => setIsSignedIn(true)} />;
}
