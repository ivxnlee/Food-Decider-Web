import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FoodModalAction {
  label: string;
  onClick: () => void;
  isTouch?: boolean;
  className?: string;
  disabled?: boolean;
  tooltipText?: string;
  initStatus?: string;
  lockLoading?: boolean;
}

interface FoodModalProps {
  /** Icon element to display at the top (e.g. a HugeiconsIcon) */
  icon: ReactNode;
  /** Background color class for the icon circle (e.g. "bg-green-500/20") */
  iconBgColor?: string;
  /** Title heading text */
  title: string;
  /** Description content — can be a string or JSX */
  description: ReactNode;
  /** Optional content shown above the collapsible details */
  previewContent?: ReactNode;
  /** Primary action button config */
  action: FoodModalAction;
  /** Secondary/cancel action button config (optional) */
  secondaryAction?: FoodModalAction;
  /** Controlled visibility */
  open?: boolean;
  /** Called when backdrop is clicked */
  onClose?: () => void;
}

export function FoodModal({
  icon,
  iconBgColor = "bg-white/10",
  title,
  description,
  previewContent,
  action,
  secondaryAction,
  open = true,
  onClose,
}: FoodModalProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-sky-100 dark:bg-black rounded-lg shadow-xl p-8 max-w-md w-full mx-4 border border-white/10">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center mb-3`}
          >
            {icon}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            {title}
          </h2>

          {/* Preview content */}
          {previewContent && (
            <div className="mb-4 flex w-full justify-center p-2">
              <div className="w-full max-w-sm">{previewContent}</div>
            </div>
          )}

          {/* Description */}
          <div className="w-full mb-6">
            <div className="mt-2 rounded-lg border border-slate-300/70 bg-white/70 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {description}
            </div>
          </div>
          <div className="w-full flex flex-col gap-2">
            {/* Primary action */}
            <Tooltip
              open={
                action.isTouch && action.disabled && !action.lockLoading
                  ? true
                  : undefined
              }
            >
              <TooltipTrigger asChild>
                <span className="inline-block w-full">
                  <Button
                    onClick={action.onClick}
                    size="xlg"
                    className={action.className ?? "w-full"}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </Button>
                </span>
              </TooltipTrigger>
              {action.initStatus === "logged out" && (
                <TooltipContent className="bg-green-700 text-white">
                  <p className="text-sm text-slate-200">{action.tooltipText}</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Optional secondary action */}
            {secondaryAction && (
              <Button
                variant="brightgreen"
                size="lg"
                onClick={secondaryAction.onClick}
                className={
                  secondaryAction.className ?? "w-full mt-2 text-white"
                }
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
