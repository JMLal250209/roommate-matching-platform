// frontend/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./SignIn.jsx";
import Register from "./Register.jsx";
import Home from "./pages/Home.jsx";
import CreateProfile from "./pages/CreateProfile.jsx";
import ProfileHousingRequirements from "./pages/ProfileHousingRequirements.jsx";
import ProfileAboutYou from "./pages/ProfileAboutYou.jsx";
import ProfileView from "./pages/ProfileView.jsx";
import PropertyDetails from "./pages/details.jsx";
import LandingPage from "./LandingPage.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import { useAuth } from "./context/AuthContext.jsx";

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
      <Route
        path="/create-profile"
        element={
          <RequireAuth>
            <CreateProfile />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/housing"
        element={
          <RequireAuth>
            <ProfileHousingRequirements />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/about-you"
        element={
          <RequireAuth>
            <ProfileAboutYou />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/view"
        element={
          <RequireAuth>
            <ProfileView />
          </RequireAuth>
        }
      />
      <Route
        path="/landing"
        element={
          <RequireAuth>
            <LandingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/properties/:propertyId"
        element={
          <RequireAuth>
            <PropertyDetails />
          </RequireAuth>
        }
      />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
