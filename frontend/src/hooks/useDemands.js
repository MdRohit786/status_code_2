import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDemands, createDemand } from "../api/demands";

export function useDemands() {
  return useQuery({
    queryKey: ["demands"],
    queryFn: listDemands,
  });
}

export function useCreateDemand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDemand,
    onSuccess: () => {
      queryClient.invalidateQueries(["demands"]);
    },
  });
}
