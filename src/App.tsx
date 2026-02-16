import "./App.css";
import Home from "./pages/home";
import { Toaster } from "@/components/ui/sonner"

function App() {
    return (
        <div className="App">
            <Home />
            <Toaster position="top-right" />
        </div>
    );
}

export default App;
