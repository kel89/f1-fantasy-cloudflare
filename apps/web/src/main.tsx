import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ThemeSync } from "./ThemeSync.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeSync>
      <App />
    </ThemeSync>
  </React.StrictMode>
);
