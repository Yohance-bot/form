import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import View from "./View.jsx";
import "./index.css";

const ADMIN_PATH_PREFIX = "/hmcoe-admin";

const hashPath = (window.location.hash || "").replace(/^#/, "");
const effectivePath = hashPath || window.location.pathname;
const isAdmin = effectivePath.startsWith(ADMIN_PATH_PREFIX);
const isView = effectivePath.startsWith("/view");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isAdmin ? <Admin /> : (isView ? <View /> : <App />)}
  </StrictMode>
);
