import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReportCard from "./ReportCard";
import ChartComponent from "./ChartComponent";
import DataTable from "./DataTable";
import { useReports } from "../../hooks/useReports";

const CustomerReport = ({ dateRange }) => {
  const { t } = useTranslation();
  const {
    customerData,
    loading,
    error,
    fetchCustomerReport,
    exportReportToPDF,
    exportReportToCSV,
  } = useReports();
  const [frequencyChartData, setFrequencyChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loyaltyChartData, setLoyaltyChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [customersTableData, setCustomersTableData] = useState([]);
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
      fetchCustomerReport(dateRange);
      prevDateRangeRef.current = { ...dateRange };
    }
  }, [dateRange, fetchCustomerReport]);

  // Process data for charts when report data changes
  useEffect(() => {
    console.log("CustomerData changed:", customerData);

    let isMounted = true;

    const processData = () => {
      if (!isMounted || !customerData) {
        // Reset states if component unmounted or no data
        if (isMounted) {
          console.log("No customer data, clearing states");
          setFrequencyChartData({ labels: [], datasets: [] });
          setLoyaltyChartData({ labels: [], datasets: [] });
          setCustomersTableData([]);
        }
        return;
      }

      try {
        console.log("Processing customer data:", {
          hasCustomerData: Boolean(customerData),
          hasSummary: Boolean(customerData.summary),
          hasTopCustomers: Boolean(customerData.topCustomers),
          hasNewCustomersOverTime: Boolean(customerData.newCustomersOverTime),
        });

        // Prepare data for purchase frequency chart
        if (
          customerData.purchaseFrequency &&
          Object.keys(customerData.purchaseFrequency).length > 0
        ) {
          console.log("Purchase frequency:", customerData.purchaseFrequency);
          const labels = Object.keys(customerData.purchaseFrequency).map(
            (key) => {
              switch (key) {
                case "oneTime":
                  return t("reports.customer.oneTime");
                case "occasional":
                  return t("reports.customer.occasional");
                case "regular":
                  return t("reports.customer.regular");
                case "frequent":
                  return t("reports.customer.frequent");
                default:
                  return key;
              }
            }
          );

          const values = Object.values(customerData.purchaseFrequency);

          setFrequencyChartData({
            labels,
            datasets: [
              {
                label: t("reports.customer.customerCount"),
                data: values,
                backgroundColor: [
                  "rgba(242, 53, 87, 0.7)", // Neon Red
                  "rgba(242, 183, 5, 0.7)", // Amber
                  "rgba(54, 242, 163, 0.7)", // Neon Green
                  "rgba(126, 63, 242, 0.7)", // Purple
                ],
                borderColor: [
                  "rgba(242, 53, 87, 1)",
                  "rgba(242, 183, 5, 1)",
                  "rgba(54, 242, 163, 1)",
                  "rgba(126, 63, 242, 1)",
                ],
                borderWidth: 1,
              },
            ],
          });
        } else {
          setFrequencyChartData({ labels: [], datasets: [] });
        }

        // Prepare data for loyalty points distribution
        if (
          Array.isArray(customerData.loyaltyDistribution) &&
          customerData.loyaltyDistribution.length > 0
        ) {
          console.log(
            "Loyalty distribution:",
            customerData.loyaltyDistribution
          );
          const labels = customerData.loyaltyDistribution.map(
            (item) => item.range
          );
          const values = customerData.loyaltyDistribution.map(
            (item) => item.count
          );

          setLoyaltyChartData({
            labels,
            datasets: [
              {
                label: t("reports.customer.customerCount"),
                data: values,
                backgroundColor: "rgba(61, 156, 242, 0.7)", // Neon Blue
                borderColor: "rgba(61, 156, 242, 1)",
                borderWidth: 1,
              },
            ],
          });
        } else {
          setLoyaltyChartData({ labels: [], datasets: [] });
        }

        // Prepare top customers table data
        if (
          Array.isArray(customerData.topCustomers) &&
          customerData.topCustomers.length > 0
        ) {
          console.log("Top customers:", customerData.topCustomers.slice(0, 2));
          setCustomersTableData(
            customerData.topCustomers.map((customer) => ({
              name:
                customer.customerName ||
                `${customer.firstName || ""} ${
                  customer.lastName || ""
                }`.trim() ||
                "Unknown",
              totalSpent: customer.totalSpent,
              purchaseCount: customer.purchaseCount,
              loyaltyPoints: customer.loyaltyPoints,
              lastPurchase: customer.lastPurchase
                ? new Date(customer.lastPurchase).toLocaleDateString()
                : "-",
              averageOrderValue:
                customer.totalSpent / Math.max(customer.purchaseCount || 1, 1),
            }))
          );
        } else {
          setCustomersTableData([]);
        }
      } catch (err) {
        console.error("Error processing customer data:", err);
        // Reset all states on error
        setFrequencyChartData({ labels: [], datasets: [] });
        setLoyaltyChartData({ labels: [], datasets: [] });
        setCustomersTableData([]);
      }
    };

    processData();

    // Cleanup function
    return () => {
      console.log("CustomerReport useEffect cleanup");
      isMounted = false;
    };
  }, [customerData, t]);

  // Handle PDF export
  const handleExportPDF = () => {
    exportReportToPDF("customers", dateRange);
  };

  // Handle CSV export
  const handleExportCSV = () => {
    exportReportToCSV("customers", dateRange);
  };

  // Customer table columns configuration
  const customerColumns = [
    { key: "name", label: t("reports.customer.customerName"), sortable: true },
    {
      key: "totalSpent",
      label: t("reports.customer.totalSpent"),
      sortable: true,
      render: (row) =>
        `$${
          row.totalSpent != null
            ? row.totalSpent.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"
        }`,
    },
    {
      key: "purchaseCount",
      label: t("reports.customer.purchaseCount"),
      sortable: true,
      render: (row) =>
        row.purchaseCount != null ? row.purchaseCount.toLocaleString() : "0",
    },
    {
      key: "averageOrderValue",
      label: t("reports.customer.averageOrderValue"),
      sortable: true,
      render: (row) =>
        `$${
          row.averageOrderValue != null
            ? row.averageOrderValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"
        }`,
    },
    {
      key: "loyaltyPoints",
      label: t("reports.customer.loyaltyPoints"),
      sortable: true,
      render: (row) =>
        row.loyaltyPoints != null ? row.loyaltyPoints.toLocaleString() : "0",
    },
    {
      key: "lastPurchase",
      label: t("reports.customer.lastPurchase"),
      sortable: true,
    },
  ];

  // Render the customer summary if we have data
  const renderCustomerSummary = () => {
    if (!customerData || !customerData.summary) return null;

    const {
      totalCustomers,
      newCustomers,
      activeCustomers,
      totalLoyaltyPoints,
    } = customerData.summary;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-primary/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.customer.totalCustomers")}
          </h3>
          <p className="text-2xl font-bold">
            {totalCustomers != null ? totalCustomers.toLocaleString() : "0"}
          </p>
        </div>
        <div className="card bg-success/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.customer.newCustomers")}
          </h3>
          <p className="text-2xl font-bold">
            {newCustomers != null ? newCustomers.toLocaleString() : "0"}
          </p>
        </div>
        <div className="card bg-info/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.customer.activeCustomers")}
          </h3>
          <p className="text-2xl font-bold">
            {activeCustomers != null ? activeCustomers.toLocaleString() : "0"}
          </p>
        </div>
        <div className="card bg-warning/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.customer.totalLoyaltyPoints")}
          </h3>
          <p className="text-2xl font-bold">
            {totalLoyaltyPoints != null
              ? totalLoyaltyPoints.toLocaleString()
              : "0"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <ReportCard
        title={t("reports.customer.title")}
        description={t("reports.customer.description")}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        loading={loading}
        error={error}
      >
        {customerData && (
          <div>
            {renderCustomerSummary()}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-4">
                  {t("reports.customer.purchaseFrequency")}
                </h3>
                <ChartComponent
                  type="pie"
                  data={frequencyChartData}
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
                  {t("reports.customer.loyaltyPointsDistribution")}
                </h3>
                <ChartComponent
                  type="bar"
                  data={loyaltyChartData}
                  height={300}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">
                {t("reports.customer.topCustomers")}
              </h3>
              <DataTable
                columns={customerColumns}
                data={customersTableData}
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

export default CustomerReport;
