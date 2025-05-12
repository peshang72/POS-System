import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReportCard from "./ReportCard";
import ChartComponent from "./ChartComponent";
import DataTable from "./DataTable";
import { useReports } from "../../hooks/useReports";

const InventoryReport = ({ dateRange }) => {
  const { t } = useTranslation();
  const {
    inventoryData,
    loading,
    error,
    fetchInventoryReport,
    exportReportToPDF,
    exportReportToCSV,
  } = useReports();
  const [categoryChartData, setCategoryChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [inventoryTableData, setInventoryTableData] = useState([]);
  const [stockAlertData, setStockAlertData] = useState([]);
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
      fetchInventoryReport(dateRange);
      prevDateRangeRef.current = { ...dateRange };
    }
  }, [dateRange, fetchInventoryReport]);

  // Process data for charts when report data changes
  useEffect(() => {
    console.log("InventoryData changed:", inventoryData);

    let isMounted = true;

    const processData = () => {
      // Only process if component is still mounted and we have data
      if (!isMounted || !inventoryData) {
        return;
      }

      try {
        console.log("Processing inventory data:", {
          hasInventoryData: Boolean(inventoryData),
          hasCategoryInventory: Boolean(inventoryData.categoryInventory),
          hasProducts: Boolean(inventoryData.products),
          hasLowStockItems: Boolean(inventoryData.lowStockItems),
          summary: inventoryData.summary,
        });

        // Process category data for chart
        if (
          Array.isArray(inventoryData.categoryInventory) &&
          inventoryData.categoryInventory.length > 0
        ) {
          console.log("Category inventory:", inventoryData.categoryInventory);
          const labels = inventoryData.categoryInventory.map((category) => {
            // Handle categoryName properly - it might be an object with language keys
            if (
              category.categoryName &&
              typeof category.categoryName === "object"
            ) {
              return (
                category.categoryName.en ||
                Object.values(category.categoryName)[0] ||
                t("common.uncategorized")
              );
            }
            return category.categoryName || t("common.uncategorized");
          });
          const quantities = inventoryData.categoryInventory.map(
            (category) => category.productCount
          );

          setCategoryChartData({
            labels,
            datasets: [
              {
                label: t("reports.inventory.productCount"),
                data: quantities,
                backgroundColor: [
                  "rgba(126, 63, 242, 0.8)",
                  "rgba(54, 162, 235, 0.8)",
                  "rgba(255, 206, 86, 0.8)",
                  "rgba(75, 192, 192, 0.8)",
                  "rgba(153, 102, 255, 0.8)",
                  "rgba(255, 159, 64, 0.8)",
                ],
                borderWidth: 1,
              },
            ],
          });
        } else {
          // Reset chart if no category data
          setCategoryChartData({ labels: [], datasets: [] });
        }

        // Process inventory data for table
        if (
          Array.isArray(inventoryData.products) &&
          inventoryData.products.length > 0
        ) {
          console.log("Products data:", inventoryData.products.slice(0, 2)); // Just log first 2 to save space
          setInventoryTableData(
            inventoryData.products.map((product) => ({
              name:
                product.name?.en ||
                (typeof product.name === "object"
                  ? Object.values(product.name)[0]
                  : product.name),
              sku: product.sku,
              category:
                product.category?.name?.en ||
                (product.category?.name &&
                typeof product.category.name === "object"
                  ? Object.values(product.category.name)[0]
                  : product.category?.name) ||
                t("common.uncategorized"),
              quantity: product.quantity,
              price: product.price,
              cost: product.cost,
              value: product.value,
              costValue: product.costValue,
            }))
          );
        } else {
          // Reset table if no product data
          setInventoryTableData([]);
        }

        // Process low stock data
        if (
          Array.isArray(inventoryData.lowStockItems) &&
          inventoryData.lowStockItems.length > 0
        ) {
          console.log(
            "Low stock items:",
            inventoryData.lowStockItems.slice(0, 2)
          ); // Just log first 2
          setStockAlertData(
            inventoryData.lowStockItems.map((product) => ({
              name:
                product.name?.en ||
                (typeof product.name === "object"
                  ? Object.values(product.name)[0]
                  : product.name),
              sku: product.sku,
              quantity: product.quantity,
              threshold: product.lowStockThreshold || product.reorderLevel,
            }))
          );
        } else {
          // Reset low stock alert data if no items
          setStockAlertData([]);
        }
      } catch (err) {
        console.error("Error processing inventory data:", err);
        // Reset all data on error
        setCategoryChartData({ labels: [], datasets: [] });
        setInventoryTableData([]);
        setStockAlertData([]);
      }
    };

    processData();

    // Cleanup function
    return () => {
      console.log("InventoryReport useEffect cleanup");
      isMounted = false;
    };
  }, [inventoryData, t]);

  // Handle PDF export
  const handleExportPDF = () => {
    exportReportToPDF("inventory", dateRange);
  };

  // Handle CSV export
  const handleExportCSV = () => {
    exportReportToCSV("inventory", dateRange);
  };

  // Inventory table columns configuration
  const inventoryColumns = [
    {
      key: "name",
      label: t("reports.inventory.productName"),
      sortable: true,
    },
    { key: "sku", label: t("reports.inventory.sku"), sortable: true },
    { key: "category", label: t("reports.inventory.category"), sortable: true },
    {
      key: "quantity",
      label: t("reports.inventory.quantity"),
      sortable: true,
      render: (row) =>
        row.quantity != null ? row.quantity.toLocaleString() : "0",
    },
    {
      key: "price",
      label: t("reports.inventory.price"),
      sortable: true,
      render: (row) =>
        `$${
          row.price != null
            ? row.price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"
        }`,
    },
    {
      key: "cost",
      label: t("reports.inventory.cost"),
      sortable: true,
      render: (row) =>
        `$${
          row.cost != null
            ? row.cost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"
        }`,
    },
    {
      key: "value",
      label: t("reports.inventory.value"),
      sortable: true,
      render: (row) =>
        `$${
          row.value != null
            ? row.value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"
        }`,
    },
    {
      key: "costValue",
      label: t("reports.inventory.costValue"),
      sortable: true,
      render: (row) =>
        `$${
          row.costValue != null
            ? row.costValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"
        }`,
    },
  ];

  // Low stock table columns configuration
  const lowStockColumns = [
    {
      key: "name",
      label: t("reports.inventory.productName"),
      sortable: true,
    },
    { key: "sku", label: t("reports.inventory.sku"), sortable: true },
    {
      key: "quantity",
      label: t("reports.inventory.quantity"),
      sortable: true,
      render: (row) =>
        row.quantity != null ? row.quantity.toLocaleString() : "0",
    },
    {
      key: "threshold",
      label: t("reports.inventory.lowStockThreshold"),
      sortable: true,
      render: (row) =>
        row.threshold != null ? row.threshold.toLocaleString() : "0",
    },
  ];

  // Render the inventory KPIs if we have data
  const renderInventoryKPIs = () => {
    if (!inventoryData || !inventoryData.summary) return null;

    const {
      totalProducts,
      totalQuantity,
      totalInventoryValue,
      totalInventoryCost,
      lowStockItems,
      outOfStockItems,
    } = inventoryData.summary;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="card bg-primary/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.inventory.totalProducts")}
          </h3>
          <p className="text-2xl font-bold">
            {totalProducts != null ? totalProducts.toLocaleString() : "0"}
          </p>
        </div>
        <div className="card bg-blue-500/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.inventory.totalQuantity")}
          </h3>
          <p className="text-2xl font-bold">
            {totalQuantity != null ? totalQuantity.toLocaleString() : "0"}
          </p>
        </div>
        <div className="card bg-success/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.inventory.inventoryValue")}
          </h3>
          <p className="text-2xl font-bold">
            $
            {totalInventoryValue != null
              ? totalInventoryValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"}
          </p>
        </div>
        <div className="card bg-indigo-600/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.inventory.inventoryCost")}
          </h3>
          <p className="text-2xl font-bold">
            $
            {totalInventoryCost != null
              ? totalInventoryCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"}
          </p>
        </div>
        <div className="card bg-warning/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.inventory.lowStockItems")}
          </h3>
          <p className="text-2xl font-bold">
            {lowStockItems != null ? lowStockItems.toLocaleString() : "0"}
          </p>
        </div>
        <div className="card bg-error/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.inventory.outOfStockItems")}
          </h3>
          <p className="text-2xl font-bold">
            {outOfStockItems != null ? outOfStockItems.toLocaleString() : "0"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <ReportCard
        title={t("reports.inventory.title")}
        description={t("reports.inventory.description")}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        loading={loading}
        error={error}
      >
        {inventoryData && (
          <div>
            {renderInventoryKPIs()}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-4">
                  {t("reports.inventory.productsByCategory")}
                </h3>
                <ChartComponent
                  type="doughnut"
                  data={categoryChartData}
                  height={300}
                  options={{
                    plugins: {
                      legend: {
                        position: "right",
                      },
                    },
                  }}
                />
              </div>

              <div>
                <h3 className="font-medium mb-4">
                  {t("reports.inventory.lowStockAlerts")}
                </h3>
                {stockAlertData.length > 0 ? (
                  <DataTable
                    columns={lowStockColumns}
                    data={stockAlertData}
                    pagination={true}
                    itemsPerPage={5}
                  />
                ) : (
                  <div className="bg-success/10 p-4 rounded-lg text-center">
                    <p className="text-success">
                      {t("reports.inventory.noLowStockItems")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">
                {t("reports.inventory.inventoryDetails")}
              </h3>
              <DataTable
                columns={inventoryColumns}
                data={inventoryTableData}
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

export default InventoryReport;
