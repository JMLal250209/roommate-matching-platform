// frontend/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./SignIn.jsx";
import Register from "./Register.jsx";
import Home from "./pages/Home.jsx";
import CreateProfile from "./pages/CreateProfile.jsx";
import ProfileHousingRequirements from "./pages/ProfileHousingRequirements.jsx";
import ProfileAboutYou from "./pages/ProfileAboutYou.jsx";
import ProfileView from "./pages/ProfileView.jsx";
import LandingPage from "./LandingPage.jsx";
import PropertyDetails from "./pages/details.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/create-profile" element={<CreateProfile />} />
      <Route path="/profile/housing" element={<ProfileHousingRequirements />} />
      <Route path="/profile/about-you" element={<ProfileAboutYou />} />
      <Route path="/profile/view" element={<ProfileView />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/house1/details" element={<PropertyDetails />} />
    </Routes>
  );
}
