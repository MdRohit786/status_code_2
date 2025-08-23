// Simple localStorage-based mock DB
const KEY = "community_demands";

export function getAll() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveAll(demands) {
  localStorage.setItem(KEY, JSON.stringify(demands));
}
