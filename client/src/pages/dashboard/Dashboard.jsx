import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  UserPlus,
  PackagePlus,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Zap,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

// Custom animated gradient component
const AnimatedGradient = ({ colors, blur = "medium" }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }

    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const circleSize = Math.max(dimensions.width, dimensions.height);

  // Fixed: Use conditional rendering instead of dynamic classes
  let blurClasses = "absolute inset-0 blur-xl"; // default for medium
  if (blur === "light") {
    blurClasses = "absolute inset-0 blur-lg";
  } else if (blur === "heavy") {
    blurClasses = "absolute inset-0 blur-2xl";
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className={blurClasses}>
        {colors.map((color, index) => (
          <svg
            key={index}
            className="absolute animate-pulse"
            style={{
              top: `${Math.random() * 50}%`,
              left: `${Math.random() * 50}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${5 + index}s`,
            }}
            width={circleSize * (0.5 + Math.random())}
            height={circleSize * (0.5 + Math.random())}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="50"
              fill={color}
              className="opacity-30"
            />
          </svg>
        ))}
      </div>
    </div>
  );
};

// Modern Stat Card Component
const StatCard = ({ title, value, trend, percent, icon: Icon, colors }) => {
  const isTrendUp = trend === "up";

  return (
    <div className="relative overflow-hidden rounded-lg bg-secondary-bg h-full">
      <AnimatedGradient colors={colors} />
      <div className="relative z-10 p-5 flex flex-col h-full backdrop-blur-sm">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-gray-400 text-sm">{title}</h3>
          <div className="p-2 rounded-lg bg-secondary-bg bg-opacity-50">
            {/* Fixed: Use conditional rendering instead of dynamic classes */}
            <Icon
              size={24}
              className={isTrendUp ? "text-success" : "text-error"}
            />
          </div>
        </div>
        <div className="mt-auto">
          <p className="text-2xl font-bold">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {isTrendUp ? (
              <TrendingUp size={16} className="text-success" />
            ) : (
              <TrendingDown size={16} className="text-error" />
            )}
            {/* Fixed: Use conditional rendering instead of dynamic classes */}
            <span className={isTrendUp ? "text-success" : "text-error"}>
              {percent}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({
  title,
  description,
  icon: Icon,
  to,
  color = "accent",
}) => {
  // Fixed: Replace dynamic classes with conditional rendering based on color prop
  let shadowClass =
    "card hover:shadow-neon transition-all duration-300 border border-gray-800 group";
  let hoverBorderClass = "";
  let iconContainerClass = "";

  // Handle different color options with explicit classes
  if (color === "success") {
    shadowClass =
      "card hover:shadow-neon-success transition-all duration-300 border border-gray-800 group";
    hoverBorderClass = "hover:border-success";
    iconContainerClass =
      "rounded-md p-3 bg-success bg-opacity-20 text-success transition-all duration-300 group-hover:bg-opacity-30";
  } else if (color === "info") {
    shadowClass =
      "card hover:shadow-neon-info transition-all duration-300 border border-gray-800 group";
    hoverBorderClass = "hover:border-info";
    iconContainerClass =
      "rounded-md p-3 bg-info bg-opacity-20 text-info transition-all duration-300 group-hover:bg-opacity-30";
  } else {
    // Default accent color
    shadowClass =
      "card hover:shadow-neon transition-all duration-300 border border-gray-800 group";
    hoverBorderClass = "hover:border-accent";
    iconContainerClass =
      "rounded-md p-3 bg-accent bg-opacity-20 text-accent transition-all duration-300 group-hover:bg-opacity-30";
  }

  return (
    <Link to={to} className={`${shadowClass} ${hoverBorderClass}`}>
      <div className="flex items-start gap-4">
        <div className={iconContainerClass}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-medium group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { dashboardData, loading, error, refreshDashboard } = useDashboard();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t("navigation.dashboard")}</h1>
          <p className="text-gray-400">
            {t("dashboard.welcome")}, {user?.firstName || "User"}
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={refreshDashboard}
            className="btn btn-outline flex items-center gap-2 transition-transform hover:scale-105"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span>{t("dashboard.refresh")}</span>
          </button>
          <Link
            to="/reports"
            className="btn btn-secondary flex items-center gap-2 transition-transform hover:scale-105"
          >
            <BarChart2 size={18} />
            <span>{t("navigation.reports")}</span>
          </Link>
          <Link
            to="/pos"
            className="btn btn-primary flex items-center gap-2 shadow-neon transition-transform hover:scale-105"
          >
            <ShoppingCart size={18} />
            <span>{t("dashboard.newSale")}</span>
          </Link>
        </div>
      </div>

      {/* Error display if API fetch fails */}
      {error && (
        <div className="p-4 rounded-lg bg-error bg-opacity-20 border border-error text-error">
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && !dashboardData.recentTransactions.length && (
        <div className="flex justify-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <RefreshCw size={32} className="animate-spin text-accent mb-2" />
            <p className="text-gray-400">{t("dashboard.loading")}</p>
          </div>
        </div>
      )}

      {/* Modern Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t("dashboard.todaySales")}
          value={dashboardData.todaySales}
          trend={dashboardData.salesTrend}
          percent={dashboardData.salesPercent}
          icon={DollarSign}
          colors={["#36F2A3", "#3D9CF2"]}
        />
        <StatCard
          title={t("dashboard.totalProducts")}
          value={dashboardData.totalProducts}
          trend={dashboardData.productsTrend}
          percent={dashboardData.productsPercent}
          icon={Package}
          colors={["#3D9CF2", "#7E3FF2"]}
        />
        <StatCard
          title={t("dashboard.lowStock")}
          value={dashboardData.lowStock}
          trend={dashboardData.lowStockTrend}
          percent={dashboardData.lowStockPercent}
          icon={AlertTriangle}
          colors={["#F2B705", "#F23557"]}
        />
        <StatCard
          title={t("dashboard.activeUsers")}
          value={dashboardData.activeUsers}
          trend={dashboardData.usersTrend}
          percent={dashboardData.usersPercent}
          icon={Users}
          colors={["#7E3FF2", "#36F2A3"]}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap size={18} className="text-accent" />
          {t("dashboard.quickActions")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            title={t("dashboard.newSale")}
            description="Create a new transaction"
            icon={ShoppingCart}
            to="/pos"
            color="success"
          />
          <ActionCard
            title={t("dashboard.addProduct")}
            description="Add a new product to inventory"
            icon={PackagePlus}
            to="/inventory"
            color="info"
          />
          <ActionCard
            title={t("dashboard.addCustomer")}
            description="Add a new customer to the database"
            icon={UserPlus}
            to="/customers"
            color="accent"
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-accent" />
            <h2 className="text-xl font-bold">
              {t("dashboard.recentTransactions")}
            </h2>
          </div>
          <Link
            to="/reports"
            className="text-sm text-accent hover:underline flex items-center gap-1"
          >
            {t("dashboard.viewAll")}
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="space-y-4">
          {dashboardData.recentTransactions.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {loading ? t("dashboard.loading") : t("dashboard.noTransactions")}
            </div>
          ) : (
            dashboardData.recentTransactions.map((transaction) => (
              <Link
                key={transaction.id}
                to={`/transactions/${transaction.id}`}
                className="block"
              >
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800 bg-opacity-50 hover:bg-opacity-70 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent bg-opacity-20 flex items-center justify-center">
                      <ShoppingCart size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Order #{transaction.id}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${transaction.amount}</p>
                    <p
                      className={`text-xs px-2 py-1 rounded-full ${
                        transaction.status === "Completed"
                          ? "bg-success bg-opacity-20 text-success"
                          : transaction.status === "Pending"
                          ? "bg-warning bg-opacity-20 text-warning"
                          : "bg-error bg-opacity-20 text-error"
                      } inline-block`}
                    >
                      {transaction.status}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
