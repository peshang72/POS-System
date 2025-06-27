import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../PermissionGuard";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  UserCircle,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  ChevronRight,
  ChevronLeft,
  Gamepad2,
} from "lucide-react";
import UpdateNotification from "../ui/UpdateNotification";
import ElectronInfo from "../ElectronInfo";
import ServerLogs from "../ServerLogs";
import axios from "axios";
import toast from "react-hot-toast";

// Neon Border Component
const NeonBorder = ({ active, color = "accent" }) => {
  if (!active) return null;

  return (
    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-accent to-transparent opacity-90 animate-pulse-fast shadow-[0_0_12px_rgba(126,63,242,0.9)]"></div>
  );
};

// Animated Gaming Icon
const GamingIcon = ({ icon: Icon, pulse = false }) => {
  return (
    <div className="relative">
      <div
        className={`absolute inset-0 rounded-md bg-accent opacity-30 ${
          pulse ? "animate-pulse-fast" : ""
        }`}
      ></div>
      <Icon size={20} className="relative z-10" />
    </div>
  );
};

// Animated Gradient Background
const AnimatedGradient = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute top-0 -right-48 w-64 h-64 bg-accent opacity-20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className="absolute bottom-0 -left-24 w-48 h-48 bg-success opacity-20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute top-1/2 -translate-y-1/2 left-1/4 w-32 h-32 bg-info opacity-20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "4s" }}
      ></div>
    </div>
  );
};

const DashboardLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const { canAccessPage } = usePermissions();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [textVisible, setTextVisible] = useState(!sidebarCollapsed);
  const sidebarRef = useRef(null);
  const textVisibilityTimeout = useRef(null);
  const lastPermissionsRef = useRef(null);

  // Add CSS animation rules to head
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes float {
        0% { transform: translateY(0) translateX(0); }
        50% { transform: translateY(-10px) translateX(5px); }
        100% { transform: translateY(0) translateX(0); }
      }
      .animate-float {
        animation: float 8s ease-in-out infinite;
      }
      @keyframes pulse-soft {
        0% { opacity: 0.2; }
        50% { opacity: 0.5; }
        100% { opacity: 0.2; }
      }
      .animate-pulse-soft {
        animation: pulse-soft 1.5s ease-in-out infinite;
      }
      @keyframes pulse-fast {
        0% { opacity: 0.3; }
        50% { opacity: 0.8; }
        100% { opacity: 0.3; }
      }
      .animate-pulse-fast {
        animation: pulse-fast 1s ease-in-out infinite;
      }
      @keyframes border-glow {
        0% { box-shadow: 0 0 5px rgba(126,63,242,0.5); }
        50% { box-shadow: 0 0 20px rgba(126,63,242,0.9); }
        100% { box-shadow: 0 0 5px rgba(126,63,242,0.5); }
      }
      .animate-border-glow {
        animation: border-glow 2s ease-in-out infinite;
      }
      .text-shadow-neon {
        text-shadow: 0 0 10px rgba(126,63,242,0.8);
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Manage text visibility with delay to match sidebar transition
  useEffect(() => {
    if (isHovering || !sidebarCollapsed) {
      clearTimeout(textVisibilityTimeout.current);
      setTextVisible(true);
    } else {
      // Delay hiding text until the sidebar animation is almost complete
      textVisibilityTimeout.current = setTimeout(() => {
        setTextVisible(false);
      }, 300); // Slightly shorter than the sidebar transition (400ms)
    }

    return () => {
      clearTimeout(textVisibilityTimeout.current);
    };
  }, [isHovering, sidebarCollapsed]);

  // Check for permission updates periodically
  useEffect(() => {
    if (!user || !refreshUser) return;

    const checkPermissionUpdates = async () => {
      try {
        const updatedUser = await refreshUser();
        if (updatedUser) {
          const currentPermissions = JSON.stringify(
            updatedUser.permissions || {}
          );
          const lastPermissions = lastPermissionsRef.current;

          if (lastPermissions && lastPermissions !== currentPermissions) {
            toast.success(
              "Your permissions have been updated. Some features may now be available or restricted.",
              { duration: 4000 }
            );
          }

          lastPermissionsRef.current = currentPermissions;
        }
      } catch (error) {
        // Silently handle errors - don't spam the user with error messages
        console.error("Error checking permission updates:", error);
      }
    };

    // Set initial permissions reference
    if (user.permissions) {
      lastPermissionsRef.current = JSON.stringify(user.permissions || {});
    }

    // Check for updates every 30 seconds
    const interval = setInterval(checkPermissionUpdates, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user, refreshUser]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    setSidebarCollapsed(false);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setSidebarCollapsed(true);
  };

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    if (!newState) {
      // If expanding, ensure we keep the expanded state even when not hovering
      setIsHovering(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ku" : "en";
    i18n.changeLanguage(newLang);

    // Update user preference if authenticated
    if (user) {
      // This would ideally call an API to update the user's language preference
      try {
        // Call API to update user language preference
      } catch (error) {
        console.error("Error updating language preference:", error);
      }
    }

    // Toggle RTL class for Kurdish language
    if (newLang === "ku") {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center gap-3 py-3 px-4 rounded-md transition-all duration-400 ${
          isActive
            ? "bg-secondary-bg text-accent font-medium"
            : "text-gray-300 hover:bg-secondary-bg hover:bg-opacity-50"
        } ${sidebarCollapsed && !textVisible ? "justify-center" : ""}`
      }
      onMouseEnter={() => setHoveredItem(to)}
      onMouseLeave={() => setHoveredItem(null)}
    >
      {({ isActive }) => (
        <>
          <NeonBorder active={isActive} />
          <div className="relative">
            <Icon
              size={20}
              className={`${
                isActive ? "text-accent" : "text-gray-300"
              } transition-all duration-300 ${
                isActive ? "text-shadow-neon" : ""
              }`}
            />
            {(isActive || hoveredItem === to) && (
              <div className="absolute inset-0 bg-accent blur-lg opacity-30 animate-pulse-fast"></div>
            )}
          </div>
          <span
            className={`transition-all duration-400 ${
              isActive ? "translate-x-1 text-shadow-neon" : ""
            } whitespace-nowrap`}
            style={{
              opacity: textVisible ? 1 : 0,
              maxWidth: textVisible ? "200px" : "0",
              overflow: "hidden",
              visibility: textVisible ? "visible" : "hidden",
              transform: `translateX(${isActive ? "4px" : "0px"})`,
              transition:
                "transform 0.3s ease, opacity 0.3s ease, max-width 0.4s ease, visibility 0.3s ease",
            }}
          >
            {label}
          </span>
          {textVisible &&
            isActive &&
            (i18n.language === "ku" ? (
              <ChevronLeft
                size={16}
                className="ml-auto text-accent animate-pulse-fast"
              />
            ) : (
              <ChevronRight
                size={16}
                className="ml-auto text-accent animate-pulse-fast"
              />
            ))}
        </>
      )}
    </NavLink>
  );

  // Footer button component with consistent icon visibility
  const FooterButton = ({
    icon: Icon,
    onClick,
    label,
    hoverClass = "hover:bg-secondary-bg hover:bg-opacity-50",
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 py-2 px-4 rounded-md text-gray-300 transition-colors ${hoverClass} ${
        !textVisible ? "justify-center" : ""
      }`}
    >
      <Icon size={20} className="flex-shrink-0" />
      <span
        className="transition-all duration-400 whitespace-nowrap"
        style={{
          opacity: textVisible ? 1 : 0,
          maxWidth: textVisible ? "200px" : "0",
          overflow: "hidden",
          visibility: textVisible ? "visible" : "hidden",
          transition:
            "opacity 0.4s ease, max-width 0.4s ease, visibility 0.3s ease",
        }}
      >
        {label}
      </span>
    </button>
  );

  return (
    <div className="flex h-screen bg-primary-bg text-white">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-md bg-secondary-bg text-white hover:bg-accent hover:bg-opacity-20 transition-colors"
        >
          {mobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-gray-900 shadow-xl overflow-y-auto overflow-x-hidden transition-all duration-400 transform z-40 ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed && !isHovering ? "lg:w-16" : "lg:w-64"}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="py-4 flex flex-col h-full relative">
          <AnimatedGradient />

          {/* Logo and sidebar toggle */}
          <div className="flex items-center justify-between px-4 mb-6 relative z-10">
            <div className="flex items-center">
              <GamingIcon icon={Gamepad2} pulse={true} />
              <h1
                className={`ml-3 font-bold text-xl transition-all duration-400 whitespace-nowrap`}
                style={{
                  opacity: textVisible ? 1 : 0,
                  maxWidth: textVisible ? "200px" : "0",
                  overflow: "hidden",
                  visibility: textVisible ? "visible" : "hidden",
                }}
              >
                {t("app.title")}
              </h1>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:flex hidden justify-center items-center h-8 w-8 rounded-md hover:bg-secondary-bg transition-colors"
            >
              {sidebarCollapsed && !isHovering ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden flex justify-center items-center h-8 w-8 rounded-md hover:bg-secondary-bg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-2 flex-1 space-y-1 relative z-10">
            <PermissionGuard page="dashboard">
              <NavItem
                to="/"
                icon={LayoutDashboard}
                label={t("navigation.dashboard")}
              />
            </PermissionGuard>

            <PermissionGuard page="pos">
              <NavItem
                to="/pos"
                icon={ShoppingCart}
                label={t("navigation.pos")}
              />
            </PermissionGuard>

            <PermissionGuard page="products">
              <NavItem
                to="/inventory"
                icon={Package}
                label={t("navigation.inventory")}
              />
            </PermissionGuard>

            <PermissionGuard page="customers">
              <NavItem
                to="/customers"
                icon={Users}
                label={t("navigation.customers")}
              />
            </PermissionGuard>

            <PermissionGuard page="staff">
              <NavItem
                to="/staff"
                icon={UserCircle}
                label={t("navigation.staff")}
              />
            </PermissionGuard>

            <PermissionGuard page="reports">
              <NavItem
                to="/reports"
                icon={BarChart2}
                label={t("navigation.reports")}
              />
            </PermissionGuard>

            <PermissionGuard page="settings">
              <NavItem
                to="/settings"
                icon={Settings}
                label={t("navigation.settings")}
              />
            </PermissionGuard>
          </nav>

          {/* Add ElectronInfo component here */}
          <div className="px-2 relative z-10">
            <ElectronInfo />
          </div>

          {/* Add ServerLogs component here */}
          <div className="px-2 relative z-10">
            <ServerLogs />
          </div>

          {/* Footer buttons */}
          <div className="p-4 border-t border-gray-800 backdrop-blur-sm relative z-10">
            <div className="flex flex-col gap-2">
              <FooterButton
                icon={Globe}
                onClick={toggleLanguage}
                label={i18n.language === "en" ? "Kurdish" : "English"}
              />

              <FooterButton
                icon={LogOut}
                onClick={handleLogout}
                label={t("auth.logout")}
                hoverClass="hover:bg-error hover:bg-opacity-20 hover:text-error"
              />

              {user && (
                <div
                  className={`flex items-center gap-3 mt-2 py-2 px-4 rounded-md bg-secondary-bg bg-opacity-50 border border-gray-800 transition-all duration-400 ${
                    !textVisible ? "justify-center" : ""
                  }`}
                  style={{
                    minHeight: "48px",
                    opacity: 1, // Always visible, content adapts
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-neon animate-border-glow flex-shrink-0">
                    <span className="text-white font-bold">
                      {user.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden transition-all duration-400"
                    style={{
                      opacity: textVisible ? 1 : 0,
                      maxWidth: textVisible ? "200px" : "0",
                      transition: "opacity 0.4s ease, max-width 0.4s ease",
                    }}
                  >
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.role}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 overflow-auto bg-gradient-to-br from-primary-bg to-secondary-bg"
        style={{
          transition: "margin-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        <div className="container mx-auto p-4 md:p-6">
          <Outlet />
        </div>

        {/* Auto-update notification component */}
        <UpdateNotification />
      </main>
    </div>
  );
};

export default DashboardLayout;
