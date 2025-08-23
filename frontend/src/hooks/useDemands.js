import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDemands, createDemand } from "../api/demands";
import { useNotifications } from "../context/NotificationContext";

export function useDemands() {
  const { addNotification } = useNotifications();
  
  return useQuery({
    queryKey: ["demands"],
    queryFn: listDemands,
    onSuccess: (data) => {
      // Check for urgent demands (expiring in 6 hours or less)
      const urgentDemands = data.filter(demand => demand.expiresInHours <= 6);
      
      urgentDemands.forEach(demand => {
        addNotification({
          type: 'urgent',
          title: 'Urgent Demand Alert!',
          message: `${demand.title} expires in ${demand.expiresInHours}h`,
          location: `${demand.lat?.toFixed(4)}, ${demand.lng?.toFixed(4)}`,
          priority: 'high',
          autoRemove: false
        });
      });

      // Check for demand hotspots
      const categoryGroups = data.reduce((acc, demand) => {
        if (!acc[demand.category]) acc[demand.category] = [];
        acc[demand.category].push(demand);
        return acc;
      }, {});

      Object.entries(categoryGroups).forEach(([category, demands]) => {
        if (demands.length >= 5) { // Hotspot threshold
          addNotification({
            type: 'info',
            title: 'Demand Hotspot Detected',
            message: `${demands.length} ${category} demands in your area`,
            priority: 'medium'
          });
        }
      });
    }
  });
}

export function useCreateDemand() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: createDemand,
    onSuccess: (newDemand) => {
      queryClient.invalidateQueries(["demands"]);
      
      // Notify about successful demand creation
      addNotification({
        type: 'success',
        title: 'Demand Posted Successfully!',
        message: `Your ${newDemand.category} demand has been added to the map`,
        location: `${newDemand.lat?.toFixed(4)}, ${newDemand.lng?.toFixed(4)}`
      });

      // Simulate vendor notifications (in real app, this would be server-side)
      setTimeout(() => {
        addNotification({
          type: 'info',
          title: 'Vendor Alert',
          message: `New ${newDemand.category} demand posted nearby`,
          priority: 'medium'
        });
      }, 2000);
    }
  });
}
