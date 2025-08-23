import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          🌍 Community Demand Map
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          A simple platform to connect <span className="font-semibold">buyers</span> and{" "}
          <span className="font-semibold">vendors</span> in your community.
          Post your needs, explore nearby demands, and support each other.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/map"
            className="px-5 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            View Demand Map
          </Link>
          <Link
            to="/post"
            className="px-5 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            Post a Demand
          </Link>
          <Link
            to="/vendor"
            className="px-5 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
          >
            Vendor Dashboard
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-sm text-gray-500">
        Built with ❤️ by your community
      </footer>
    </div>
  );
}
