import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import DemandMap from "./pages/DemandMap";
import PostDemand from "./pages/PostDemand";
import VendorDashboard from "./pages/VendorDashboard";
import NotFound from "./pages/NotFound";
import FAB from "./components/FAB";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<DemandMap />} />
        <Route path="/post" element={<PostDemand />} />
        <Route path="/vendor" element={<VendorDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <FAB />
    </div>
  );
}

export default App;
