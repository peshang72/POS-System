import { useTranslation } from "react-i18next";
import { FileText, Database, Loader2 } from "lucide-react";

const ReportCard = ({
  title,
  description,
  children,
  onExportPDF,
  onExportCSV,
  loading = false,
  error = null,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-base-100 rounded-lg">
      <div className="px-6 py-4 border-b border-base-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onExportPDF}
            disabled={loading}
            className="btn btn-outline btn-sm px-3 py-2 flex items-center gap-2 transition-all hover:bg-primary/10"
            title={t("reports.exportPDF")}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t("reports.pdf")}</span>
          </button>
          <button
            onClick={onExportCSV}
            disabled={loading}
            className="btn btn-outline btn-sm px-3 py-2 flex items-center gap-2 transition-all hover:bg-primary/10"
            title={t("reports.exportCSV")}
          >
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">{t("reports.csv")}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-primary">
            <Loader2 className="h-12 w-12 animate-spin opacity-70" />
            <p className="mt-4 text-base-content/70 font-medium">
              {t("common.loading")}
            </p>
          </div>
        ) : error ? (
          <div className="bg-error/10 border border-error/20 text-error p-4 rounded-lg flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ReportCard;
