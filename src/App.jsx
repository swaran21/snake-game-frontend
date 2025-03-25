import React, { useState } from "react";
import Login from "./components/Login";
import Game from "./components/Game";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="App">
      {!user ? <Login onLogin={(userData) => setUser(userData)} /> : <Game user={user} />}
    </div>
  );
}

export default App;
