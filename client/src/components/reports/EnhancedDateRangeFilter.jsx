import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import "react-day-picker/dist/style.css";

const EnhancedDateRangeFilter = ({ onFilterChange }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("presets");
  const [selectedRange, setSelectedRange] = useState(null);
  const [month, setMonth] = useState(new Date());
  const popoverRef = React.useRef(null);

  // Generate presets
  const presets = [
    {
      id: "today",
      name: t("reports.dateRanges.today"),
      getValue: () => {
        const today = new Date();
        return {
          from: today,
          to: today,
        };
      },
    },
    {
      id: "yesterday",
      name: t("reports.dateRanges.yesterday"),
      getValue: () => {
        const today = new Date();
        const yesterday = subDays(today, 1);
        return {
          from: yesterday,
          to: yesterday,
        };
      },
    },
    {
      id: "last7days",
      name: t("reports.dateRanges.last7days"),
      getValue: () => {
        const today = new Date();
        return {
          from: subDays(today, 6),
          to: today,
        };
      },
    },
    {
      id: "last30days",
      name: t("reports.dateRanges.last30days"),
      getValue: () => {
        const today = new Date();
        return {
          from: subDays(today, 29),
          to: today,
        };
      },
    },
    {
      id: "thisMonth",
      name: t("reports.dateRanges.thisMonth"),
      getValue: () => {
        const today = new Date();
        return {
          from: startOfMonth(today),
          to: today,
        };
      },
    },
    {
      id: "lastMonth",
      name: t("reports.dateRanges.lastMonth"),
      getValue: () => {
        const today = new Date();
        const lastMonth = subMonths(today, 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      },
    },
  ];

  // Initialize with the "last7days" preset
  useEffect(() => {
    const initialPreset = presets.find((preset) => preset.id === "last7days");
    if (initialPreset) {
      const range = initialPreset.getValue();
      setSelectedRange(range);
      handleRangeChange(range);
    }
  }, []);

  // Handle click outside to close the popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRangeChange = (range) => {
    setSelectedRange(range);

    if (range && range.from) {
      // Set month to the selected date for calendar display
      setMonth(range.from);

      // Convert to YYYY-MM-DD strings for API
      const startDate = format(range.from, "yyyy-MM-dd");
      const endDate = range.to ? format(range.to, "yyyy-MM-dd") : startDate;

      onFilterChange({
        startDate,
        endDate,
      });
    }
  };

  const handlePresetSelect = (preset) => {
    const newRange = preset.getValue();
    handleRangeChange(newRange);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Date Range Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-gray-700 bg-secondary-bg py-2 px-3 text-white hover:bg-accent/10"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-accent" />
          <span>
            {selectedRange?.from ? (
              selectedRange.to &&
              selectedRange.to.getTime() !== selectedRange.from.getTime() ? (
                <>
                  {format(selectedRange.from, "MMM dd, yyyy")} -{" "}
                  {format(selectedRange.to, "MMM dd, yyyy")}
                </>
              ) : (
                format(selectedRange.from, "MMM dd, yyyy")
              )
            ) : (
              <span>{t("reports.selectDateRange")}</span>
            )}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {/* Date Picker Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute right-0 z-50 mt-2 w-80 rounded-md border border-gray-800 bg-secondary-bg p-4 shadow-lg animate-in"
        >
          <div className="mb-4">
            <h3 className="text-base font-medium text-white">
              {t("reports.selectDateRange")}
            </h3>
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <div className="flex rounded-md bg-gray-800/40 p-1">
              <button
                onClick={() => setActiveTab("presets")}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "presets"
                    ? "bg-accent/20 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t("reports.dateRanges.presets")}
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "custom"
                    ? "bg-accent/20 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t("reports.dateRanges.custom")}
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === "presets" ? (
            <div className="max-h-[300px] space-y-1 overflow-y-auto">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-white hover:bg-accent/10"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="border-t border-gray-800 pt-3">
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={handleRangeChange}
                month={month}
                onMonthChange={setMonth}
                numberOfMonths={1}
                disabled={[{ after: new Date() }]}
                className="rounded-md border border-gray-800"
                classNames={{
                  day_selected: "bg-accent text-white",
                  day_today: "border border-accent text-accent",
                  day: "text-white hover:bg-accent/20",
                  day_range_middle: "bg-accent/20 text-white",
                  day_range_start: "bg-accent text-white rounded-l-md",
                  day_range_end: "bg-accent text-white rounded-r-md",
                  head_cell: "text-gray-400 font-normal",
                  caption_label: "text-white font-medium",
                  nav_button: "text-white opacity-70 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                }}
                styles={{
                  caption: { color: "white" },
                  day_selected: { backgroundColor: "#7E3FF2" },
                  day_today: { borderColor: "#7E3FF2", color: "#7E3FF2" },
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedDateRangeFilter;
