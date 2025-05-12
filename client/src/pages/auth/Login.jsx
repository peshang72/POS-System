import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";

const Login = () => {
  const { t } = useTranslation();
  const { login, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(formData.username, formData.password);
      // Login function handles redirect in AuthContext
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {(error || authError) && (
          <div className="p-3 bg-error bg-opacity-20 rounded-md text-error text-sm">
            {error || authError}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium">
            {t("auth.username")}
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={formData.username}
            onChange={handleChange}
            className="input w-full"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            {t("auth.password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleChange}
            className="input w-full"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-600 bg-secondary-bg text-accent focus:ring-accent"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm">
              {t("auth.rememberMe")}
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="text-accent hover:text-accent-light">
              {t("auth.forgotPassword")}
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? t("common.loading") : t("auth.loginButton")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
