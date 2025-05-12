import * as React from "react";
import { cn } from "../../lib/utils";

const TabsContext = React.createContext({
  value: "",
  onValueChange: () => {},
});

const Tabs = React.forwardRef(
  (
    { className, value, onValueChange, defaultValue, children, ...props },
    ref
  ) => {
    const [stateValue, setStateValue] = React.useState(
      value || defaultValue || ""
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setStateValue(value);
      }
    }, [value]);

    const handleValueChange = React.useCallback(
      (newValue) => {
        setStateValue(newValue);
        if (onValueChange) {
          onValueChange(newValue);
        }
      },
      [onValueChange]
    );

    const contextValue = React.useMemo(
      () => ({
        value: stateValue,
        onValueChange: handleValueChange,
      }),
      [stateValue, handleValueChange]
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

const useTabsContext = () => React.useContext(TabsContext);

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn("flex flex-wrap bg-secondary-bg rounded-md", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: activeValue, onValueChange } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-accent/10 data-[state=active]:text-white",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: activeValue } = useTabsContext();
  const isActive = activeValue === value;

  if (!isActive) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      tabIndex={0}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
