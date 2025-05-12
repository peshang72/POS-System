import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Table2,
  Database,
} from "lucide-react";

const DataTable = ({ columns, data, pagination = true, itemsPerPage = 10 }) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Calculate total pages
  const totalPages = pagination ? Math.ceil(data.length / itemsPerPage) : 1;

  // Get current page data
  const currentData = pagination
    ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : data;

  // Sorting logic
  const sortedData = [...currentData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const keyA = a[sortConfig.key];
    const keyB = b[sortConfig.key];

    if (keyA < keyB) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (keyA > keyB) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Handle sort click
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Generate pagination controls
  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;

    const paginationItems = [];

    // Calculate visible page numbers
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    // Adjust if we're at the end
    if (endPage - startPage < 2) {
      startPage = Math.max(1, endPage - 2);
    }

    // Previous button
    paginationItems.push(
      <button
        key="prev"
        className="join-item btn btn-sm btn-outline border-base-300"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );

    // First page button if not in visible range
    if (startPage > 1) {
      paginationItems.push(
        <button
          key={1}
          className="join-item btn btn-sm btn-outline border-base-300"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      // Add ellipsis if there's a gap
      if (startPage > 2) {
        paginationItems.push(
          <button
            key="start-ellipsis"
            className="join-item btn btn-sm btn-outline border-base-300"
            disabled
          >
            ...
          </button>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <button
          key={i}
          className={`join-item btn btn-sm ${
            currentPage === i
              ? "btn-primary text-white"
              : "btn-outline border-base-300"
          }`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Last page button if not in visible range
    if (endPage < totalPages) {
      // Add ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        paginationItems.push(
          <button
            key="end-ellipsis"
            className="join-item btn btn-sm btn-outline border-base-300"
            disabled
          >
            ...
          </button>
        );
      }
      paginationItems.push(
        <button
          key={totalPages}
          className="join-item btn btn-sm btn-outline border-base-300"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    paginationItems.push(
      <button
        key="next"
        className="join-item btn btn-sm btn-outline border-base-300"
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    );

    return (
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="text-xs text-muted-foreground">
          {t("common.showing")} {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, data.length)} {t("common.of")}{" "}
          {data.length}
        </div>
        <div className="join">{paginationItems}</div>
      </div>
    );
  };

  // Render empty state
  if (data.length === 0) {
    return (
      <div className="bg-base-200/50 p-8 rounded-lg text-center">
        <div className="flex justify-center">
          <div className="bg-base-200 p-4 rounded-full">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h3 className="mt-4 text-base font-medium">
          {t("common.noDataAvailable")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          {t("common.noDataDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-base-300 bg-white">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b border-base-300 bg-base-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`h-10 px-4 text-left align-middle font-medium text-muted-foreground ${
                    column.sortable ? "cursor-pointer hover:text-primary" : ""
                  }`}
                  onClick={
                    column.sortable ? () => handleSort(column.key) : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && (
                      <div className="ml-1">
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-primary" />
                          )
                        ) : (
                          <div className="h-3 w-3 text-transparent">•</div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-base-200 transition-colors hover:bg-base-50"
              >
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.key}`} className="p-4">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renderPagination()}
    </div>
  );
};

export default DataTable;
