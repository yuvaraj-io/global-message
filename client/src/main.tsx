import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { UIProvider } from "./context/UIContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <UIProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </UIProvider>
    </AuthProvider>
  </React.StrictMode>
);
