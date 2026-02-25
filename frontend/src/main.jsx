import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import View from "./View.jsx";
import "./index.css";

const ADMIN_PATH_PREFIX = "/hmcoe-admin";

const isAdmin = window.location.pathname.startsWith(ADMIN_PATH_PREFIX);
const isView = window.location.pathname.startsWith("/view");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isAdmin ? <Admin /> : (isView ? <View /> : <App />)}
  </StrictMode>
);
