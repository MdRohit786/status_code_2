import { Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import { AuthProvider } from "./state/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import DemandMap from "./pages/DemandMap";
import VendorDashboard from "./pages/VendorDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import FAB from "./components/FAB";

function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            
            <main className="pb-20">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/map" element={<DemandMap />} />
                <Route path="/vendor" element={<VendorDashboard />} />
                <Route path="/customer" element={<CustomerDashboard />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

            <FAB />
          </div>
        </NotificationProvider>
      </OrderProvider>
    </AuthProvider>
  );
}

export default App;
