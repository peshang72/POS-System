import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Clock } from "lucide-react";

const DateRangeFilter = ({ onFilterChange }) => {
  const { t } = useTranslation();
  const [selectedRange, setSelectedRange] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Helper function to get date as YYYY-MM-DD format
  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Generate date ranges
  const getDateRange = (range) => {
    const today = new Date();
    const endDate = formatDate(today);
    let startDate;

    switch (range) {
      case "today":
        startDate = endDate;
        break;
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = formatDate(yesterday);
        break;
      }
      case "last7days": {
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 6);
        startDate = formatDate(last7Days);
        break;
      }
      case "last30days": {
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 29);
        startDate = formatDate(last30Days);
        break;
      }
      case "thisMonth": {
        const thisMonthStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        startDate = formatDate(thisMonthStart);
        break;
      }
      case "lastMonth": {
        const lastMonthStart = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = formatDate(lastMonthStart);
        return { startDate, endDate: formatDate(lastMonthEnd) };
      }
      case "custom":
        return { startDate, endDate };
      default:
        startDate = endDate;
    }

    return { startDate, endDate };
  };

  // Handle change of preset date range
  const handleRangeChange = (e) => {
    const range = e.target.value;
    setSelectedRange(range);

    if (range !== "custom") {
      const { startDate: start, endDate: end } = getDateRange(range);
      setStartDate(start);
      setEndDate(end);
      onFilterChange({ startDate: start, endDate: end });
    }
  };

  // Handle change of custom date
  const handleDateChange = (field, value) => {
    if (field === "start") {
      setStartDate(value);
      if (value && endDate) {
        onFilterChange({ startDate: value, endDate });
      }
    } else {
      setEndDate(value);
      if (startDate && value) {
        onFilterChange({ startDate, endDate: value });
      }
    }
  };

  // Function to format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full bg-secondary-bg border border-gray-800 rounded-lg shadow-sm">
      <div className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-accent" />
            <h3 className="font-medium">{t("reports.dateRange")}</h3>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <select
                className="select w-full bg-secondary-bg border border-gray-700 text-white rounded-md focus:border-accent focus:ring-1 focus:ring-accent px-3 py-2"
                value={selectedRange}
                onChange={handleRangeChange}
              >
                <option value="today">{t("reports.dateRanges.today")}</option>
                <option value="yesterday">
                  {t("reports.dateRanges.yesterday")}
                </option>
                <option value="last7days">
                  {t("reports.dateRanges.last7days")}
                </option>
                <option value="last30days">
                  {t("reports.dateRanges.last30days")}
                </option>
                <option value="thisMonth">
                  {t("reports.dateRanges.thisMonth")}
                </option>
                <option value="lastMonth">
                  {t("reports.dateRanges.lastMonth")}
                </option>
                <option value="custom">{t("reports.dateRanges.custom")}</option>
              </select>
            </div>

            {selectedRange === "custom" ? (
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
                <div className="w-full">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Calendar className="h-4 w-4 text-accent" />
                    </div>
                    <input
                      type="date"
                      className="w-full pl-10 px-3 py-2 bg-secondary-bg text-white border border-gray-700 rounded-md focus:border-accent focus:ring-1 focus:ring-accent"
                      value={startDate}
                      onChange={(e) =>
                        handleDateChange("start", e.target.value)
                      }
                      max={endDate || undefined}
                      placeholder={t("reports.startDate")}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Calendar className="h-4 w-4 text-accent" />
                    </div>
                    <input
                      type="date"
                      className="w-full pl-10 px-3 py-2 bg-secondary-bg text-white border border-gray-700 rounded-md focus:border-accent focus:ring-1 focus:ring-accent"
                      value={endDate}
                      onChange={(e) => handleDateChange("end", e.target.value)}
                      min={startDate || undefined}
                      max={formatDate(new Date())}
                      placeholder={t("reports.endDate")}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center px-4 py-2 bg-accent/10 rounded-lg border border-accent/20 text-sm">
                <Calendar className="h-4 w-4 mr-2 text-accent" />
                <span>
                  {formatDisplayDate(startDate)}
                  {startDate !== endDate && ` - ${formatDisplayDate(endDate)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
