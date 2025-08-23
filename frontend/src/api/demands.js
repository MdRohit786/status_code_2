import { getAll, saveAll } from "./mockDb";

export async function listDemands() {
  return getAll();
}

export async function createDemand(demand) {
  const all = getAll();
  const newDemand = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...demand,
  };
  all.push(newDemand);
  saveAll(all);
  return newDemand;
}
