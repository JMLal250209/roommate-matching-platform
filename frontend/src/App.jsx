import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./SignIn.jsx";
import Register from "./Register.jsx";
import Home from "./pages/Home.jsx";
import CreateProfile from "./pages/CreateProfile.jsx";
import ProfileHousingRequirements from "./pages/ProfileHousingRequirements.jsx";
import ProfileAboutYou from "./pages/ProfileAboutYou.jsx";
import ProfileView from "./pages/ProfileView.jsx";
import PropertyDetails from "./pages/details.jsx";
import GreenPage from "./pages/Green.jsx";
import LandingPage from "./LandingPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Matches from "./Matches.jsx";
import MatchDetail from "./pages/MatchDetail.jsx";
import MatchedProfileView from "./pages/MatchedProfileView.jsx";
import MatchProfiles from "./pages/MatchProfiles";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/create-profile" : "/signin"} replace />}
      />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/create-profile" element={<CreateProfile />} />
      <Route path="/profile/housing" element={<ProfileHousingRequirements />} />
      <Route path="/profile/about-you" element={<ProfileAboutYou />} />
      <Route path="/profile/view" element={<ProfileView />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/house1/details" element={<PropertyDetails />} />
      <Route path="/green" element={<GreenPage />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/matches/:interestId" element={<MatchDetail />} />
      <Route path="/profile/:userId" element={<MatchedProfileView />} />
      <Route path="/matches/:interestId/profiles" element={<MatchProfiles />} />
    </Routes>
  );
}