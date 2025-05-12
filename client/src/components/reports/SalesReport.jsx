import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReportCard from "./ReportCard";
import ChartComponent from "./ChartComponent";
import DataTable from "./DataTable";
import { useReports } from "../../hooks/useReports";

const SalesReport = ({ dateRange }) => {
  const { t } = useTranslation();
  const {
    salesData,
    loading,
    error,
    fetchSalesReport,
    exportReportToPDF,
    exportReportToCSV,
  } = useReports();
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [tableData, setTableData] = useState([]);
  const prevDateRangeRef = useRef(null);

  // Fetch data when dateRange changes - with proper dependency tracking
  useEffect(() => {
    // Compare with previous date range to avoid unnecessary fetches
    const prevDateRange = prevDateRangeRef.current;
    const isDateRangeChanged =
      !prevDateRange ||
      prevDateRange.startDate !== dateRange.startDate ||
      prevDateRange.endDate !== dateRange.endDate;

    if (isDateRangeChanged) {
      fetchSalesReport(dateRange);
      prevDateRangeRef.current = { ...dateRange };
    }
  }, [dateRange, fetchSalesReport]);

  // Process data for chart when report data changes
  useEffect(() => {
    console.log("SalesData changed:", salesData);

    let isMounted = true;

    const processData = () => {
      if (!isMounted || !salesData) {
        // Reset chart and table data if no sales data is available
        if (isMounted) {
          console.log("No sales data, clearing states");
          setChartData({ labels: [], datasets: [] });
          setTableData([]);
        }
        return;
      }

      try {
        console.log("Processing sales data:", {
          hasSalesData: Boolean(salesData),
          hasSalesByDate: Boolean(salesData.salesByDate),
          hasTopProducts: Boolean(salesData.topProducts),
          hasSummary: Boolean(salesData.summary),
        });

        // Prepare data for the sales over time chart
        if (
          Array.isArray(salesData.salesByDate) &&
          salesData.salesByDate.length > 0
        ) {
          console.log("Sales by date:", salesData.salesByDate);
          const labels = salesData.salesByDate.map((item) => item.date);
          const salesValues = salesData.salesByDate.map((item) => item.total);

          setChartData({
            labels,
            datasets: [
              {
                label: t("reports.sales.totalSales"),
                data: salesValues,
                borderColor: "rgba(126, 63, 242, 1)",
                backgroundColor: "rgba(126, 63, 242, 0.1)",
                tension: 0.4,
                fill: true,
              },
            ],
          });
        } else {
          setChartData({ labels: [], datasets: [] });
        }

        // Prepare data for the top products table
        if (
          Array.isArray(salesData.topProducts) &&
          salesData.topProducts.length > 0
        ) {
          console.log("Top products:", salesData.topProducts.slice(0, 2));
          setTableData(
            salesData.topProducts.map((product) => ({
              productName: product.name?.en || product.name,
              sku: product.sku,
              quantity: product.quantity,
              revenue: product.revenue,
              profit: product.profit,
            }))
          );
        } else {
          setTableData([]);
        }
      } catch (err) {
        console.error("Error processing sales data:", err);
        // Reset on error
        setChartData({ labels: [], datasets: [] });
        setTableData([]);
      }
    };

    processData();

    // Cleanup function
    return () => {
      console.log("SalesReport useEffect cleanup");
      isMounted = false;
    };
  }, [salesData, t]);

  // Handle PDF export
  const handleExportPDF = () => {
    exportReportToPDF("sales", dateRange);
  };

  // Handle CSV export
  const handleExportCSV = () => {
    exportReportToCSV("sales", dateRange);
  };

  // Table columns configuration
  const columns = [
    {
      key: "productName",
      label: t("reports.sales.productName"),
      sortable: true,
    },
    { key: "sku", label: "SKU", sortable: true },
    {
      key: "quantity",
      label: t("reports.sales.quantity"),
      sortable: true,
      render: (row) =>
        row.quantity != null ? row.quantity.toLocaleString() : "0",
    },
    {
      key: "revenue",
      label: t("reports.sales.revenue"),
      sortable: true,
      render: (row) =>
        `$${
          row.revenue != null
            ? row.revenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"
        }`,
    },
    {
      key: "profit",
      label: t("reports.sales.profit"),
      sortable: true,
      render: (row) =>
        `$${
          row.profit != null
            ? row.profit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"
        }`,
    },
  ];

  // Render the sales KPIs if we have data
  const renderSalesKPIs = () => {
    if (!salesData || !salesData.summary) return null;

    const { totalSales, totalTransactions, averageOrderValue, grossProfit } =
      salesData.summary;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-accent/10 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">
            {t("reports.sales.totalSales")}
          </h3>
          <p className="text-2xl font-bold">
            $
            {totalSales != null
              ? totalSales.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"}
          </p>
        </div>
        <div className="card bg-success/10 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">
            {t("reports.sales.totalTransactions")}
          </h3>
          <p className="text-2xl font-bold">
            {totalTransactions != null
              ? totalTransactions.toLocaleString()
              : "0"}
          </p>
        </div>
        <div className="card bg-warning/10 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">
            {t("reports.sales.averageOrderValue")}
          </h3>
          <p className="text-2xl font-bold">
            $
            {averageOrderValue != null
              ? averageOrderValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"}
          </p>
        </div>
        <div className="card bg-info/10 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">
            {t("reports.sales.grossProfit")}
          </h3>
          <p className="text-2xl font-bold">
            $
            {grossProfit != null
              ? grossProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <ReportCard
        title={t("reports.sales.title")}
        description={t("reports.sales.description")}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        loading={loading}
        error={error}
      >
        {salesData && (
          <div>
            {renderSalesKPIs()}

            <div className="mb-6">
              <h3 className="font-medium mb-4">
                {t("reports.sales.salesOverTime")}
              </h3>
              <ChartComponent type="line" data={chartData} height={300} />
            </div>

            <div>
              <h3 className="font-medium mb-4">
                {t("reports.sales.topProducts")}
              </h3>
              <DataTable
                columns={columns}
                data={tableData}
                pagination={true}
                itemsPerPage={10}
              />
            </div>
          </div>
        )}
      </ReportCard>
    </>
  );
};

export default SalesReport;
