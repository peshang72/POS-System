/**
 * Format a number as currency with $ symbol
 * @param {number} amount - The amount to format
 * @param {string} currencySymbol - Currency symbol to use (defaults to $)
 * @returns {string} Formatted currency string
 */
exports.formatCurrency = (amount, currencySymbol = "$") => {
  if (amount === null || amount === undefined) {
    return `${currencySymbol}0.00`;
  }

  return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
};

/**
 * Format a date in a consistent way
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
exports.formatDate = (date, options = {}) => {
  if (!date) return "";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("en-US", {
    ...defaultOptions,
    ...options,
  }).format(dateObj);
};

/**
 * Format a percentage value
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
exports.formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) {
    return "0%";
  }

  return `${parseFloat(value).toFixed(decimals)}%`;
};
