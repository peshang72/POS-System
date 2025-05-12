import * as React from "react";
import { cn } from "../../lib/utils";

const PopoverContext = React.createContext({
  open: false,
  onOpenChange: () => {},
});

const usePopoverContext = () => React.useContext(PopoverContext);

const Popover = ({ children, open = false, onOpenChange }) => {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleOpenChange = (value) => {
    setIsOpen(value);
    if (onOpenChange) {
      onOpenChange(value);
    }
  };

  const popoverContextValue = React.useMemo(
    () => ({
      open: isOpen,
      onOpenChange: handleOpenChange,
    }),
    [isOpen]
  );

  return (
    <PopoverContext.Provider value={popoverContextValue}>
      <div className="relative inline-block w-full">{children}</div>
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = React.forwardRef(
  ({ className, asChild = false, ...props }, ref) => {
    const { open, onOpenChange } = usePopoverContext();
    const Comp = asChild ? React.Fragment : "button";

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : "button"}
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        onClick={() => onOpenChange(!open)}
        className={cn(asChild ? "" : "inline-flex w-full", className)}
        {...props}
      />
    );
  }
);
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef(
  ({ className, align = "center", sideOffset = 4, ...props }, ref) => {
    const { open } = usePopoverContext();

    if (!open) return null;

    return (
      <div
        ref={ref}
        data-state={open ? "open" : "closed"}
        data-align={align}
        className={cn(
          "z-50 w-72 rounded-md border border-gray-800 bg-secondary-bg p-4 text-white shadow-md outline-none animate-in data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    );
  }
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
