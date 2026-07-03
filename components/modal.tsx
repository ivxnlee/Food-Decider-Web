import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModalAction {
  label: string;
  onClick: () => void;
  isTouch?: boolean;
  className?: string;
  disabled?: boolean;
  tooltipText?: string;
  lockLoading?: boolean;
}

interface ModalProps {
  /** Icon element to display at the top (e.g. a HugeiconsIcon) */
  icon: ReactNode;
  /** Background color class for the icon circle (e.g. "bg-green-500/20") */
  iconBgColor?: string;
  /** Title heading text */
  title: string;
  /** Description content — can be a string or JSX */
  description: ReactNode;
  /** Primary action button config */
  action: ModalAction;
  /** Secondary/cancel action button config (optional) */
  secondaryAction?: ModalAction;
  /** Controlled visibility */
  open?: boolean;
  /** Called when backdrop is clicked */
  onClose?: () => void;
}

export function Modal({
  icon,
  iconBgColor = "bg-white/10",
  title,
  description,
  action,
  secondaryAction,
  open = true,
  onClose,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-black rounded-lg shadow-xl p-8 max-w-md w-full mx-4 border border-white/10">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={`w-16 h-16 rounded-full ${iconBgColor} flex items-center justify-center mb-4`}
          >
            {icon}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

          {/* Description */}
          <div className="text-slate-300 mb-6">{description}</div>
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
                    className={action.className ?? "w-full"}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </Button>
                </span>
              </TooltipTrigger>
              {action.disabled && (
                <TooltipContent className="bg-red-800 text-white">
                  <p className="text-sm text-slate-200">{action.tooltipText}</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Optional secondary action */}
            {secondaryAction && (
              <Button
                variant="secondary"
                onClick={secondaryAction.onClick}
                className={
                  secondaryAction.className ??
                  "w-full mt-2 text-slate-400 hover:text-white"
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
