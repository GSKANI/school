import React from "react";
import { createRoot } from "react-dom/client";
import CoreSchool from "./CoreSchool";

const root = document.getElementById("root");
createRoot(root).render(
  <React.StrictMode>
    <CoreSchool />
  </React.StrictMode>
);
