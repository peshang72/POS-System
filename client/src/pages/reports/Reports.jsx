import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SalesReport from "../../components/reports/SalesReport";
import InventoryReport from "../../components/reports/InventoryReport";
import StaffReport from "../../components/reports/StaffReport";
import CustomerReport from "../../components/reports/CustomerReport";
import EnhancedDateRangeFilter from "../../components/reports/EnhancedDateRangeFilter";
import { BarChart3, Package, Users, ShoppingCart } from "lucide-react";
import { useReports } from "../../hooks/useReports";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { Card, CardContent } from "../../components/ui/card";

const Reports = () => {
  const { t } = useTranslation();
  const { clearAllReportData } = useReports();
  const [activeTab, setActiveTab] = useState("sales");
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState(null);

  const handleTabChange = (value) => {
    try {
      console.log("Tab changing from", activeTab, "to", value);
      // First clear data to prevent flash of old data
      console.log("Clearing report data");
      clearAllReportData();
      // Then update the active tab
      console.log("Setting active tab to", value);
      setActiveTab(value);
      setError(null);
    } catch (err) {
      console.error("Error switching tabs:", err);
      setError("Error switching tabs. Please try again.");
    }
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Clear any error message when component unmounts
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {t("navigation.reports")}
          </h1>
          <p className="text-gray-400">{t("reports.description")}</p>
        </div>

        {/* Enhanced Date Range Filter */}
        <div className="w-full md:w-64">
          <EnhancedDateRangeFilter onFilterChange={handleDateRangeChange} />
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Modern Tabs with Icons */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="h-auto bg-secondary-bg border border-gray-800 rounded-lg p-1 mb-6 flex overflow-x-auto">
          <TabsTrigger
            value="sales"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 data-[state=active]:bg-accent/10 data-[state=active]:text-white font-medium"
          >
            <ShoppingCart className="h-4 w-4" />
            {t("reports.tabs.sales")}
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 data-[state=active]:bg-accent/10 data-[state=active]:text-white font-medium"
          >
            <Package className="h-4 w-4" />
            {t("reports.tabs.inventory")}
          </TabsTrigger>
          <TabsTrigger
            value="staff"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 data-[state=active]:bg-accent/10 data-[state=active]:text-white font-medium"
          >
            <Users className="h-4 w-4" />
            {t("reports.tabs.staff")}
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 data-[state=active]:bg-accent/10 data-[state=active]:text-white font-medium"
          >
            <BarChart3 className="h-4 w-4" />
            {t("reports.tabs.customers")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-0">
          <Card className="bg-secondary-bg border-gray-800">
            <CardContent className="p-6">
              <SalesReport
                key={`sales-${dateRange.startDate}-${dateRange.endDate}`}
                dateRange={dateRange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-0">
          <Card className="bg-secondary-bg border-gray-800">
            <CardContent className="p-6">
              <InventoryReport
                key={`inventory-${dateRange.startDate}-${dateRange.endDate}`}
                dateRange={dateRange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="mt-0">
          <Card className="bg-secondary-bg border-gray-800">
            <CardContent className="p-6">
              <StaffReport
                key={`staff-${dateRange.startDate}-${dateRange.endDate}`}
                dateRange={dateRange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="mt-0">
          <Card className="bg-secondary-bg border-gray-800">
            <CardContent className="p-6">
              <CustomerReport
                key={`customers-${dateRange.startDate}-${dateRange.endDate}`}
                dateRange={dateRange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
