import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emergencyRelationshipService } from '@/services/api/emergencyRelationshipService';

export const EMERGENCY_RELATIONSHIP_QUERY_KEY = ['emergency-relationships-list'];

export const useEmergencyRelationshipData = () => {
  return useQuery({
    queryKey: EMERGENCY_RELATIONSHIP_QUERY_KEY,
    queryFn: () => emergencyRelationshipService.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateEmergencyRelationship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => emergencyRelationshipService.createEmergencyRelationship(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCY_RELATIONSHIP_QUERY_KEY }),
  });
};

export const useUpdateEmergencyRelationship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      emergencyRelationshipService.updateEmergencyRelationship(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCY_RELATIONSHIP_QUERY_KEY }),
  });
};

export const useDeleteEmergencyRelationship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => emergencyRelationshipService.deleteEmergencyRelationship(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCY_RELATIONSHIP_QUERY_KEY }),
  });
};