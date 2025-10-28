import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApolloClientProvider } from "./apollo.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ApolloClientProvider>
      <App />
    </ApolloClientProvider>
  </BrowserRouter>
);
