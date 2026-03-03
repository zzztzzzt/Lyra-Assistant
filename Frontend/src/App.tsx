import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./HomePage";
import { ChatLyraPage } from "./ChatLyraPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat-lyra" element={<ChatLyraPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
