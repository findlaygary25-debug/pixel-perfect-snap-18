import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface OptimisticUpdateOptions<T> {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticUpdate<T>() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const performOptimisticUpdate = useCallback(
    async (
      currentData: T,
      optimisticData: T,
      updateFn: () => Promise<void>,
      rollbackFn: (data: T) => void,
      options?: OptimisticUpdateOptions<T>
    ) => {
      setIsUpdating(true);

      try {
        // Apply optimistic update immediately
        rollbackFn(optimisticData);

        // Perform the actual update
        await updateFn();

        // Show success message if provided
        if (options?.successMessage) {
          toast({
            title: "Success",
            description: options.successMessage,
          });
        }

        options?.onSuccess?.();
      } catch (error: any) {
        // Rollback to original data on error
        rollbackFn(currentData);

        // Show error message
        toast({
          title: "Error",
          description: options?.errorMessage || error.message || "Update failed",
          variant: "destructive",
        });

        options?.onError?.(error);
      } finally {
        setIsUpdating(false);
      }
    },
    [toast]
  );

  return { performOptimisticUpdate, isUpdating };
}
