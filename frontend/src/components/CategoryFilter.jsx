export default function CategoryFilter({ categories, current, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {categories.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-3 py-1 rounded-full text-sm ${
            current === c
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
