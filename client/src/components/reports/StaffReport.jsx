import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReportCard from "./ReportCard";
import ChartComponent from "./ChartComponent";
import DataTable from "./DataTable";
import { useReports } from "../../hooks/useReports";

const StaffReport = ({ dateRange }) => {
  const { t } = useTranslation();
  const {
    staffData,
    loading,
    error,
    fetchStaffReport,
    exportReportToPDF,
    exportReportToCSV,
  } = useReports();
  const [performanceChartData, setPerformanceChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [activityChartData, setActivityChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [staffTableData, setStaffTableData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
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
      fetchStaffReport(dateRange);
      prevDateRangeRef.current = { ...dateRange };
    }
  }, [dateRange, fetchStaffReport]);

  // Process data for charts when report data changes
  useEffect(() => {
    console.log("StaffData changed:", staffData);

    let isMounted = true;

    const processData = () => {
      if (!isMounted || !staffData) {
        // Reset states if component unmounted or no data
        if (isMounted) {
          console.log("No staff data, clearing states");
          setPerformanceChartData({ labels: [], datasets: [] });
          setActivityChartData({ labels: [], datasets: [] });
          setStaffTableData([]);
          setExpensesData([]);
        }
        return;
      }

      try {
        console.log("Processing staff data:", {
          hasStaffData: Boolean(staffData),
          hasStaffSales: Boolean(staffData.staffSales),
          hasStaffActivity: Boolean(staffData.staffActivity),
          hasActivityTimeline: Boolean(staffData.activityTimeline),
        });

        // Prepare data for staff performance chart
        if (
          Array.isArray(staffData.staffSales) &&
          staffData.staffSales.length > 0
        ) {
          console.log("Staff sales:", staffData.staffSales.slice(0, 2));
          const staffNames = staffData.staffSales.map((staff) => staff.name);
          const salesData = staffData.staffSales.map(
            (staff) => staff.totalSales
          );
          const transactionsData = staffData.staffSales.map(
            (staff) => staff.transactionCount
          );

          setPerformanceChartData({
            labels: staffNames,
            datasets: [
              {
                label: t("reports.staff.totalSales"),
                data: salesData,
                backgroundColor: "rgba(126, 63, 242, 0.7)",
                borderColor: "rgba(126, 63, 242, 1)",
                borderWidth: 1,
                yAxisID: "y",
              },
              {
                label: t("reports.staff.transactions"),
                data: transactionsData,
                backgroundColor: "rgba(54, 242, 163, 0.7)",
                borderColor: "rgba(54, 242, 163, 1)",
                borderWidth: 1,
                yAxisID: "y1",
                type: "line",
              },
            ],
          });

          // Prepare data for the staff table
          setStaffTableData(
            staffData.staffSales.map((staff) => ({
              name: staff.name,
              role: staff.role || "-",
              totalSales: staff.totalSales,
              transactionCount: staff.transactionCount,
              averageTicket: staff.averageTicket,
              hoursWorked: staff.hoursWorked || 0,
            }))
          );
        } else {
          setPerformanceChartData({ labels: [], datasets: [] });
          setStaffTableData([]);
        }

        // Prepare data for activity type chart if available
        if (
          staffData.staffActivity &&
          Array.isArray(staffData.staffActivity) &&
          staffData.staffActivity.length > 0
        ) {
          console.log("Staff activity:", staffData.staffActivity.slice(0, 2));

          // Process activity data as needed
          // ...
        }

        // Prepare expenses data if available
        if (
          staffData.staffExpenses &&
          Array.isArray(staffData.staffExpenses) &&
          staffData.staffExpenses.length > 0
        ) {
          console.log("Staff expenses:", staffData.staffExpenses.slice(0, 2));

          setExpensesData(
            staffData.staffExpenses.map((expense) => ({
              name: expense.staff
                ? `${expense.staff.firstName} ${expense.staff.lastName}`
                : "-",
              type: expense.type,
              amount: expense.amount,
              description: expense.description,
              date: expense.date
                ? new Date(expense.date).toLocaleDateString()
                : "-",
              status: expense.status,
            }))
          );
        } else {
          setExpensesData([]);
        }
      } catch (err) {
        console.error("Error processing staff data:", err);
        // Reset all states on error
        setPerformanceChartData({ labels: [], datasets: [] });
        setActivityChartData({ labels: [], datasets: [] });
        setStaffTableData([]);
        setExpensesData([]);
      }
    };

    processData();

    // Cleanup function
    return () => {
      console.log("StaffReport useEffect cleanup");
      isMounted = false;
    };
  }, [staffData, t]);

  // Handle PDF export
  const handleExportPDF = () => {
    exportReportToPDF("staff", dateRange);
  };

  // Handle CSV export
  const handleExportCSV = () => {
    exportReportToCSV("staff", dateRange);
  };

  // Staff table columns configuration
  const staffColumns = [
    { key: "name", label: t("reports.staff.staffName"), sortable: true },
    { key: "role", label: t("reports.staff.role"), sortable: true },
    {
      key: "totalSales",
      label: t("reports.staff.totalSales"),
      sortable: true,
      render: (row) =>
        `$${
          row.totalSales != null
            ? row.totalSales.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"
        }`,
    },
    {
      key: "transactionCount",
      label: t("reports.staff.transactions"),
      sortable: true,
      render: (row) =>
        row.transactionCount != null
          ? row.transactionCount.toLocaleString()
          : "0",
    },
    {
      key: "averageOrderValue",
      label: t("reports.staff.averageOrderValue"),
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
      key: "hoursWorked",
      label: t("reports.staff.hoursWorked"),
      sortable: true,
      render: (row) =>
        row.hoursWorked != null
          ? row.hoursWorked.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })
          : "0.0",
    },
  ];

  // Expense table columns configuration
  const expenseColumns = [
    { key: "name", label: t("reports.staff.staffName"), sortable: true },
    {
      key: "type",
      label: t("reports.staff.expenseType"),
      sortable: true,
      render: (row) => t(`reports.staff.expenseTypes.${row.type}`),
    },
    {
      key: "amount",
      label: t("reports.staff.amount"),
      sortable: true,
      render: (row) =>
        `$${
          row.amount != null
            ? row.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"
        }`,
    },
    {
      key: "description",
      label: t("reports.staff.description"),
      sortable: true,
    },
    { key: "date", label: t("reports.staff.date"), sortable: true },
    {
      key: "status",
      label: t("reports.staff.status"),
      sortable: true,
      render: (row) => (
        <span
          className={
            row.status === "approved"
              ? "text-success"
              : row.status === "rejected"
              ? "text-error"
              : "text-warning"
          }
        >
          {t(`reports.staff.statusTypes.${row.status}`)}
        </span>
      ),
    },
  ];

  // Render the staff summary if we have data
  const renderStaffSummary = () => {
    if (!staffData || !staffData.summary) return null;

    const { totalStaff, totalSales, totalTransactions, totalHours } =
      staffData.summary;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-primary/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.staff.totalStaff")}
          </h3>
          <p className="text-2xl font-bold">
            {totalStaff != null ? totalStaff : "0"}
          </p>
        </div>
        <div className="card bg-success/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.staff.periodSales")}
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
        <div className="card bg-warning/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.staff.totalTransactions")}
          </h3>
          <p className="text-2xl font-bold">
            {totalTransactions != null
              ? totalTransactions.toLocaleString()
              : "0"}
          </p>
        </div>
        <div className="card bg-info/10 p-4">
          <h3 className="text-sm text-gray-400">
            {t("reports.staff.hoursWorked")}
          </h3>
          <p className="text-2xl font-bold">
            {totalHours != null
              ? totalHours.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              : "0.0"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <ReportCard
        title={t("reports.staff.title")}
        description={t("reports.staff.description")}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        loading={loading}
        error={error}
      >
        {staffData && (
          <div>
            {renderStaffSummary()}

            <div className="mb-6">
              <h3 className="font-medium mb-4">
                {t("reports.staff.performanceComparison")}
              </h3>
              <ChartComponent
                type="bar"
                data={performanceChartData}
                height={350}
                options={{
                  scales: {
                    y: {
                      type: "linear",
                      display: true,
                      position: "left",
                      title: {
                        display: true,
                        text: t("reports.staff.totalSales"),
                        color: "#9ca3af",
                      },
                    },
                    y1: {
                      type: "linear",
                      display: true,
                      position: "right",
                      grid: {
                        drawOnChartArea: false,
                      },
                      title: {
                        display: true,
                        text: t("reports.staff.transactions"),
                        color: "#9ca3af",
                      },
                    },
                  },
                }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-4">
                  {t("reports.staff.activityByType")}
                </h3>
                <ChartComponent
                  type="pie"
                  data={activityChartData}
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
                  {t("reports.staff.staffPerformance")}
                </h3>
                <DataTable
                  columns={staffColumns}
                  data={staffTableData}
                  pagination={false}
                />
              </div>
            </div>

            {expensesData.length > 0 && (
              <div>
                <h3 className="font-medium mb-4">
                  {t("reports.staff.expensesAndLoans")}
                </h3>
                <DataTable
                  columns={expenseColumns}
                  data={expensesData}
                  pagination={true}
                  itemsPerPage={10}
                />
              </div>
            )}
          </div>
        )}
      </ReportCard>
    </>
  );
};

export default StaffReport;
