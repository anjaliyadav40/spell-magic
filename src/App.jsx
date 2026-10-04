import { useState } from "react";

import Landing from "./components/Landing";
import MagicCamera from "./components/MagicCamera";

import "./App.css";

function App() {
  const [started, setStarted] =
    useState(false);

  // ------------------------------------------
  // LANDING
  // ------------------------------------------

  if (!started) {
    return (
      <Landing
        onStart={() =>
          setStarted(true)
        }
      />
    );
  }

  // ------------------------------------------
  // MAGIC CAMERA
  // ------------------------------------------

  return (
    <div className="app">
      <MagicCamera />
    </div>
  );
}

export default App;