import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home } from "lucide-react";

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-primary-bg flex flex-col items-center justify-center text-center p-4">
      <div className="space-y-6 max-w-md">
        <h1 className="text-9xl font-bold text-accent">404</h1>
        <h2 className="text-2xl font-medium">{t("common.error")}</h2>
        <p className="text-gray-400">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="btn btn-primary inline-flex items-center space-x-2"
        >
          <Home size={20} />
          <span>Go to Homepage</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
