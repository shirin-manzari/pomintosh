import "./styles/main.css";
import "./styles/mac.css";
import "./styles/screen.css";
import { initializeApp } from "./app";
import { isTauri } from "@tauri-apps/api/core";

const root = document.querySelector<HTMLElement>("#app");

if (!root) throw new Error("App root is missing.");

if (isTauri()) document.documentElement.classList.add("desktop-app");

initializeApp(root);
