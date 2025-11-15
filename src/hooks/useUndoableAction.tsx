import { useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface UndoableActionOptions {
  successMessage: string;
  undoMessage: string;
  errorMessage?: string;
}

export function useUndoableAction() {
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performUndoableAction = useCallback(
    async function performAction<T>(
      action: () => Promise<T>,
      undoAction: () => Promise<void>,
      options: UndoableActionOptions
    ): Promise<T | undefined> {
      try {
        // Clear any existing undo timeout
        if (undoTimeoutRef.current) {
          clearTimeout(undoTimeoutRef.current);
        }

        // Perform the action
        const result = await action();

        let dismissed = false;
        
        // Show success toast with undo button
        const { dismiss } = toast({
          title: "Success",
          description: options.successMessage,
          action: (
            <ToastAction
              altText="Undo action"
              onClick={async () => {
                if (dismissed) return;
                dismissed = true;
                dismiss();
                
                try {
                  await undoAction();
                  toast({
                    title: "Undone",
                    description: options.undoMessage,
                  });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: "Failed to undo action",
                    variant: "destructive",
                  });
                }
              }}
            >
              Undo
            </ToastAction>
          ),
          duration: 5000,
        });

        // Auto-dismiss after 5 seconds
        undoTimeoutRef.current = setTimeout(() => {
          if (!dismissed) {
            dismissed = true;
            dismiss();
          }
        }, 5000);

        return result;
      } catch (error: any) {
        toast({
          title: "Error",
          description: options.errorMessage || error.message || "Action failed",
          variant: "destructive",
        });
        throw error;
      }
    },
    []
  );

  return { performUndoableAction };
}
