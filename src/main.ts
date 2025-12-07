import "./styles/main.css";
import "./styles/mac.css";
import "./styles/screen.css";
import { initializeApp } from "./app";

const root = document.querySelector<HTMLElement>("#app");

if (!root) throw new Error("App root is missing.");

initializeApp(root);
