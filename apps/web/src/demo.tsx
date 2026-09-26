import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { setBackend } from "./api";
import { AppRoutes } from "./App";
import { demoApi } from "./demo/backend";
import "./styles.css";

// The artifact frame gives no usable URL path, so routes live in memory; fonts come from the page's
// Google Fonts link because that is the host the artifact CSP allows.
setBackend(demoApi);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MemoryRouter>
      <AppRoutes />
    </MemoryRouter>
  </StrictMode>,
);
