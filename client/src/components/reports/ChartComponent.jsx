import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { useTranslation } from "react-i18next";

const ChartComponent = ({
  type = "bar",
  data = { labels: [], datasets: [] },
  options = {},
  height = 300,
  width = null,
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Modern color palette
    const defaultColors = [
      "rgba(99, 102, 241, 0.7)", // Indigo
      "rgba(16, 185, 129, 0.7)", // Emerald
      "rgba(245, 158, 11, 0.7)", // Amber
      "rgba(239, 68, 68, 0.7)", // Red
      "rgba(59, 130, 246, 0.7)", // Blue
      "rgba(236, 72, 153, 0.7)", // Pink
      "rgba(139, 92, 246, 0.7)", // Purple
      "rgba(20, 184, 166, 0.7)", // Teal
    ];

    // Create default font config
    const fontFamily =
      "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

    // Apply default styling with modern aesthetics
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          align: "start",
          labels: {
            color: "#374151", // Gray-700
            usePointStyle: true,
            padding: 15,
            boxWidth: 8,
            boxHeight: 8,
            font: {
              family: fontFamily,
              weight: 500,
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          titleColor: "#1f2937", // Gray-800
          bodyColor: "#4b5563", // Gray-600
          borderColor: "rgba(229, 231, 235, 1)", // Gray-200
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          cornerRadius: 8,
          bodyFont: {
            family: fontFamily,
            size: 12,
          },
          titleFont: {
            family: fontFamily,
            size: 13,
            weight: 600,
          },
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#6b7280", // Gray-500
            font: {
              family: fontFamily,
              size: 11,
            },
            padding: 5,
          },
          grid: {
            display: false,
            drawBorder: false,
          },
          border: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: "#6b7280", // Gray-500
            font: {
              family: fontFamily,
              size: 11,
            },
            padding: 8,
            maxTicksLimit: 6,
          },
          grid: {
            color: "rgba(243, 244, 246, 0.8)", // Gray-100
            drawBorder: false,
            borderDash: [2, 4],
            lineWidth: 1,
          },
          border: {
            display: false,
          },
        },
      },
      elements: {
        line: {
          tension: 0.3, // Smoother lines
        },
        point: {
          radius: 3,
          hoverRadius: 5,
        },
        bar: {
          borderRadius: 4,
        },
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10,
        },
      },
    };

    // Apply default colors if not provided
    const enhancedData = {
      ...data,
      datasets: data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor:
          dataset.backgroundColor ||
          defaultColors[index % defaultColors.length],
        borderColor:
          dataset.borderColor ||
          (type === "line"
            ? defaultColors[index % defaultColors.length].replace("0.7", "1")
            : "transparent"),
        borderWidth: dataset.borderWidth || (type === "line" ? 2 : 0),
        hoverBackgroundColor: defaultColors[
          index % defaultColors.length
        ].replace("0.7", "0.8"),
      })),
    };

    // Merge default options with provided options
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      plugins: {
        ...defaultOptions.plugins,
        ...(options.plugins || {}),
      },
      scales: {
        ...defaultOptions.scales,
        ...(options.scales || {}),
      },
    };

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart instance
    if (chartRef.current) {
      chartInstance.current = new Chart(chartRef.current, {
        type,
        data: enhancedData,
        options: mergedOptions,
      });
    }

    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, options, t]);

  return (
    <div
      className="bg-white p-4 rounded-lg border border-base-200"
      style={{ height: `${height}px`, width: width ? `${width}px` : "100%" }}
    >
      <canvas ref={chartRef} />
    </div>
  );
};

export default ChartComponent;
