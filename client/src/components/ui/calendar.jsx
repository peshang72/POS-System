import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "../../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import global styles for the calendar
import "react-day-picker/dist/style.css";

const Calendar = ({
  className,
  classNames,
  mode = "single",
  selected,
  onSelect,
  disabled,
  month,
  onMonthChange,
  ...props
}) => {
  return (
    <DayPicker
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      month={month}
      onMonthChange={onMonthChange}
      disabled={disabled}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 text-white opacity-50 hover:opacity-100 flex items-center justify-center rounded-md"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-gray-400 rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent/10",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          "h-8 w-8 p-0 font-normal text-white aria-selected:opacity-100 flex items-center justify-center rounded-md hover:bg-gray-700 focus:bg-accent focus:text-white"
        ),
        day_range_start: "day-range-start bg-accent text-white hover:bg-accent",
        day_range_end: "day-range-end bg-accent text-white hover:bg-accent",
        day_selected:
          "bg-accent text-white hover:bg-accent hover:text-white focus:bg-accent focus:text-white",
        day_today: "border border-accent text-accent",
        day_outside: "text-gray-500 opacity-50",
        day_disabled: "text-gray-500 opacity-50",
        day_range_middle: "aria-selected:bg-accent/10 aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      styles={{
        caption: { color: "white" },
        day_selected: { backgroundColor: "#7E3FF2" },
        day_today: { borderColor: "#7E3FF2", color: "#7E3FF2" },
        day_range_middle: { backgroundColor: "rgba(126, 63, 242, 0.1)" },
        day_range_start: { backgroundColor: "#7E3FF2" },
        day_range_end: { backgroundColor: "#7E3FF2" },
      }}
      {...props}
    />
  );
};
Calendar.displayName = "Calendar";

export { Calendar };
