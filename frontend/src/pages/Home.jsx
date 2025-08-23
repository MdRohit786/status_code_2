import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <h1 className="text-3xl font-bold mb-6">Community Demand Map</h1>
      <p className="mb-6 text-gray-600">
        See local needs, post requests, and help vendors respond.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          to="/map"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View Map
        </Link>
        <Link
          to="/post"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Post Demand
        </Link>
      </div>
    </div>
  );
}
