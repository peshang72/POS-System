import { useTranslation } from "react-i18next";

// Individual stat card component
const StatCard = ({
  title,
  value,
  icon,
  trend,
  percent,
  colorClass = "bg-primary/10",
}) => {
  const trendIcon =
    trend === "up" ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-success"
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-error"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    );

  return (
    <div className={`card ${colorClass} p-4 flex flex-row items-center`}>
      <div
        className={`rounded-full p-3 mr-4 text-white ${colorClass.replace(
          "/10",
          ""
        )}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-sm text-gray-400">{title}</h3>
        <div className="flex items-center">
          <p className="text-xl font-bold">{value}</p>
          {trend && percent && (
            <div className="flex items-center ml-2 text-xs">
              {trendIcon}
              <span className={trend === "up" ? "text-success" : "text-error"}>
                {percent}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stats summary grid component
const StatsSummary = ({ stats = [] }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          percent={stat.percent}
          colorClass={stat.colorClass}
        />
      ))}
    </div>
  );
};

export default StatsSummary;
