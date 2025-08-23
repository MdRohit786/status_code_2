import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function FAB() {
  return (
    <Link
      to="/post"
      className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
    >
      <Plus />
    </Link>
  );
}
