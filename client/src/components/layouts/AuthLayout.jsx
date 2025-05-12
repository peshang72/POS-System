import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AuthLayout = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-secondary-bg rounded-lg shadow-neon">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent">{t("app.title")}</h1>
          <p className="text-gray-400">{t("app.tagline")}</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
