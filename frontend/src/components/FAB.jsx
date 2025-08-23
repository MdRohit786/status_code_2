import { ShoppingCart, Store } from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function FAB() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Link
        to="/auth"
        className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors z-50"
      >
        <ShoppingCart className="w-6 h-6" />
      </Link>
    );
  }

  return (
    <Link
      to={user?.role === 'vendor' ? '/vendor' : '/customer'}
      className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
    >
      {user?.role === 'vendor' ? <Store className="w-6 h-6" /> : <ShoppingCart className="w-6 h-6" />}
    </Link>
  );
}
