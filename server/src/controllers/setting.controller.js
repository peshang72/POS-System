const Setting = require("../models/setting.model");
const logger = require("../utils/logger");

/**
 * Get general settings
 * @route GET /api/settings/general
 */
exports.getGeneralSettings = async (req, res) => {
  try {
    // Get all general settings
    const settings = await Setting.getCategory("general");

    // Parse userExchangeRates if it exists
    if (settings.userExchangeRates) {
      try {
        settings.userExchangeRates = JSON.parse(settings.userExchangeRates);
      } catch (error) {
        settings.userExchangeRates = {};
      }
    } else {
      settings.userExchangeRates = {};
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error(`Error fetching general settings: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: error.message,
    });
  }
};

/**
 * Update general settings
 * @route PUT /api/settings/general
 */
exports.updateGeneralSettings = async (req, res) => {
  try {
    const { exchangeRate, applyToAllUsers } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validate exchange rate
    if (!exchangeRate || exchangeRate < 1) {
      return res.status(400).json({
        success: false,
        message: "Exchange rate must be a positive number greater than 0",
      });
    }

    if (userRole === "admin" && applyToAllUsers) {
      // Admin applying to all users - set global exchange rate and clear user-specific rates
      await Setting.setValue(
        "general",
        "exchangeRate",
        exchangeRate,
        "number",
        userId,
        "Global USD to IQD exchange rate"
      );

      // Clear all user-specific exchange rates
      await Setting.setValue(
        "general",
        "userExchangeRates",
        "{}",
        "string",
        userId,
        "User-specific exchange rates"
      );

      logger.info(
        `Admin ${req.user.username} set global exchange rate to ${exchangeRate} for all users`
      );
    } else {
      // Individual user setting (cashier, manager, or admin for themselves)
      // Get current user exchange rates
      let userExchangeRates = {};
      try {
        const currentUserRates = await Setting.getValue(
          "general",
          "userExchangeRates",
          "{}"
        );
        userExchangeRates = JSON.parse(currentUserRates);
      } catch (error) {
        userExchangeRates = {};
      }

      // Update the specific user's exchange rate
      userExchangeRates[userId] = exchangeRate;

      // Save updated user exchange rates
      await Setting.setValue(
        "general",
        "userExchangeRates",
        JSON.stringify(userExchangeRates),
        "string",
        userId,
        "User-specific exchange rates"
      );

      logger.info(
        `User ${req.user.username} (${userRole}) set personal exchange rate to ${exchangeRate}`
      );
    }

    // Return updated settings
    const updatedSettings = await Setting.getCategory("general");
    if (updatedSettings.userExchangeRates) {
      try {
        updatedSettings.userExchangeRates = JSON.parse(
          updatedSettings.userExchangeRates
        );
      } catch (error) {
        updatedSettings.userExchangeRates = {};
      }
    }

    res.status(200).json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    logger.error(`Error updating general settings: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: error.message,
    });
  }
};

/**
 * Get user's exchange rate
 * @route GET /api/settings/exchange-rate
 */
exports.getUserExchangeRate = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user-specific exchange rates
    let userExchangeRates = {};
    try {
      const currentUserRates = await Setting.getValue(
        "general",
        "userExchangeRates",
        "{}"
      );
      userExchangeRates = JSON.parse(currentUserRates);
    } catch (error) {
      userExchangeRates = {};
    }

    // Get user's specific rate or fall back to global rate
    const userRate = userExchangeRates[userId];
    const globalRate = await Setting.getValue("general", "exchangeRate", 1450);

    const exchangeRate = userRate || globalRate;

    res.status(200).json({
      success: true,
      data: {
        exchangeRate: Number(exchangeRate),
        isUserSpecific: !!userRate,
      },
    });
  } catch (error) {
    logger.error(`Error fetching user exchange rate: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Server Error",
      message: error.message,
    });
  }
};
