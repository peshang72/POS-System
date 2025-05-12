const Setting = require("../models/setting.model");
const Customer = require("../models/customer.model");
const LoyaltyTransaction = require("../models/loyaltyTransaction.model");

/**
 * LoyaltyPointsService - Handles all loyalty point calculations and rule processing
 */
class LoyaltyPointsService {
  /**
   * Calculate points to be awarded for a purchase
   * @param {number} amount - The total purchase amount
   * @param {Object} customer - The customer making the purchase
   * @param {Object} options - Additional options
   * @returns {number} - Number of points to award
   */
  async calculatePointsForPurchase(amount, customer, options = {}) {
    // Load loyalty program settings
    const settings = await this.getLoyaltySettings();

    if (!settings.enabled) {
      return 0;
    }

    let pointsToAward = 0;

    // Apply base points calculation (amount * rate)
    pointsToAward += Math.floor(amount * settings.pointsPerDollar);

    // Apply tiered bonuses if configured and applicable
    if (settings.tiers && settings.tiers.length > 0) {
      // Sort tiers by threshold in descending order
      const sortedTiers = [...settings.tiers].sort(
        (a, b) => b.threshold - a.threshold
      );

      // Find the highest tier the purchase qualifies for
      const applicableTier = sortedTiers.find(
        (tier) => amount >= tier.threshold
      );
      if (applicableTier) {
        if (applicableTier.bonusType === "fixed") {
          pointsToAward += applicableTier.bonusValue;
        } else if (applicableTier.bonusType === "percentage") {
          pointsToAward += Math.floor(
            pointsToAward * (applicableTier.bonusValue / 100)
          );
        }
      }
    }

    // Apply customer status bonuses
    if (customer && settings.statusMultipliers) {
      // Calculate customer status based on lifetime spend or other metrics
      const customerStatus = await this.determineCustomerStatus(customer);
      const statusMultiplier = settings.statusMultipliers[customerStatus] || 1;

      // Apply status multiplier
      pointsToAward = Math.floor(pointsToAward * statusMultiplier);
    }

    // Apply product category-specific bonuses if provided in options
    if (options.categories && settings.categoryBonuses) {
      for (const categoryId of options.categories) {
        const categoryBonus = settings.categoryBonuses[categoryId];
        if (categoryBonus) {
          if (categoryBonus.type === "fixed") {
            pointsToAward += categoryBonus.value;
          } else if (categoryBonus.type === "multiplier") {
            pointsToAward = Math.floor(pointsToAward * categoryBonus.value);
          }
        }
      }
    }

    // Apply special promotion bonuses if applicable
    if (options.promotionIds && settings.promotions) {
      for (const promotionId of options.promotionIds) {
        const promotion = settings.promotions.find(
          (p) => p.id === promotionId && p.active
        );
        if (promotion) {
          if (promotion.type === "fixed") {
            pointsToAward += promotion.value;
          } else if (promotion.type === "multiplier") {
            pointsToAward = Math.floor(pointsToAward * promotion.value);
          }
        }
      }
    }

    // Apply minimum points threshold
    return Math.max(pointsToAward, settings.minimumPoints || 0);
  }

  /**
   * Calculate the redemption value of points
   * @param {number} points - Number of points to redeem
   * @returns {number} - Cash value of the points
   */
  async calculateRedemptionValue(points) {
    const settings = await this.getLoyaltySettings();

    // Calculate basic redemption value
    let value = points * settings.redemptionRate;

    // Apply minimum redemption threshold
    if (points < (settings.minimumRedemption || 0)) {
      return 0;
    }

    // Apply maximum redemption cap if configured
    if (
      settings.maximumRedemptionValue &&
      value > settings.maximumRedemptionValue
    ) {
      value = settings.maximumRedemptionValue;
    }

    return value;
  }

  /**
   * Award points to a customer
   * @param {string} customerId - Customer ID
   * @param {number} points - Points to award
   * @param {string} reason - Reason for points award
   * @param {Object} reference - Reference information { type, id }
   * @param {Object} options - Additional options
   * @returns {Object} - Updated customer object
   */
  async awardPoints(customerId, points, reason, reference, options = {}) {
    // Find customer and update their points
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Add points to customer
    customer.loyaltyPoints += points;

    // Save customer
    await customer.save();

    // Create transaction record
    const transaction = new LoyaltyTransaction({
      customer: customerId,
      type: "earn",
      points: points,
      pointsBalance: customer.loyaltyPoints,
      reference: reference,
      reason: reason,
      performedBy: options.performedBy || null,
      metadata: options.metadata || {},
    });

    await transaction.save();

    return customer;
  }

  /**
   * Redeem points from a customer
   * @param {string} customerId - Customer ID
   * @param {number} points - Points to redeem
   * @param {string} reason - Reason for redemption
   * @param {Object} reference - Reference information { type, id }
   * @param {Object} options - Additional options
   * @returns {Object} - Updated customer object and redemption value
   */
  async redeemPoints(customerId, points, reason, reference, options = {}) {
    // Find customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Check if customer has enough points
    if (customer.loyaltyPoints < points) {
      throw new Error("Insufficient points balance");
    }

    // Calculate value of points
    const value = await this.calculateRedemptionValue(points);

    // Deduct points from customer
    customer.loyaltyPoints -= points;

    // Save customer
    await customer.save();

    // Create transaction record
    const transaction = new LoyaltyTransaction({
      customer: customerId,
      type: "redeem",
      points: -points, // Negative for redemption
      pointsBalance: customer.loyaltyPoints,
      reference: reference,
      reason: reason,
      value: value,
      performedBy: options.performedBy || null,
      metadata: options.metadata || {},
    });

    await transaction.save();

    return { customer, redemptionValue: value };
  }

  /**
   * Get loyalty transactions for a customer
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Array} - List of loyalty transactions
   */
  async getCustomerTransactions(customerId, options = {}) {
    const query = { customer: customerId };

    if (options.type) {
      query.type = options.type;
    }

    if (options.startDate && options.endDate) {
      query.timestamp = {
        $gte: new Date(options.startDate),
        $lte: new Date(options.endDate),
      };
    }

    const transactions = await LoyaltyTransaction.find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit || 100)
      .skip(options.skip || 0);

    return transactions;
  }

  /**
   * Determine a customer's status tier based on their history
   * @param {Object} customer - Customer object
   * @returns {string} - Status level (standard, silver, gold, platinum)
   */
  async determineCustomerStatus(customer) {
    const settings = await this.getLoyaltySettings();

    // Default status
    let status = "standard";

    // Check if status tiers are configured
    if (!settings.statusTiers) {
      return status;
    }

    // Determine status based on total spent
    if (customer.totalSpent >= settings.statusTiers.platinum) {
      status = "platinum";
    } else if (customer.totalSpent >= settings.statusTiers.gold) {
      status = "gold";
    } else if (customer.totalSpent >= settings.statusTiers.silver) {
      status = "silver";
    }

    return status;
  }

  /**
   * Get loyalty program settings from the database
   * @returns {Object} - Loyalty program settings
   */
  async getLoyaltySettings() {
    // Attempt to get settings from database
    const settingsEntry = await Setting.findOne({
      category: "loyalty",
      key: "programSettings",
    });

    // If settings exist, return them
    if (settingsEntry && settingsEntry.value) {
      return settingsEntry.value;
    }

    // Otherwise, return default settings
    return this.getDefaultLoyaltySettings();
  }

  /**
   * Update loyalty program settings
   * @param {Object} settings - New settings to apply
   * @param {string} userId - ID of user making the change
   * @returns {Object} - Updated settings
   */
  async updateLoyaltySettings(settings, userId) {
    // Merge with existing settings to avoid overwriting
    const currentSettings = await this.getLoyaltySettings();
    const updatedSettings = { ...currentSettings, ...settings };

    // Find and update or create new settings entry
    const result = await Setting.findOneAndUpdate(
      { category: "loyalty", key: "programSettings" },
      {
        category: "loyalty",
        key: "programSettings",
        value: updatedSettings,
        dataType: "object",
        updatedBy: userId,
      },
      { upsert: true, new: true }
    );

    return result.value;
  }

  /**
   * Get default loyalty program settings
   * @returns {Object} - Default loyalty settings
   */
  getDefaultLoyaltySettings() {
    return {
      enabled: true,
      pointsPerDollar: 10, // 10 points per $1 spent
      redemptionRate: 0.01, // $0.01 per point when redeeming
      minimumPoints: 1, // Minimum points to award per transaction
      minimumRedemption: 100, // Minimum points that can be redeemed
      maximumRedemptionValue: 100, // Maximum value per redemption ($100)

      // Status tiers based on total spent
      statusTiers: {
        silver: 500, // $500 total spent
        gold: 1000, // $1000 total spent
        platinum: 5000, // $5000 total spent
      },

      // Multipliers for each status
      statusMultipliers: {
        standard: 1,
        silver: 1.1, // 10% bonus
        gold: 1.2, // 20% bonus
        platinum: 1.5, // 50% bonus
      },

      // Bonus tiers based on purchase amount
      tiers: [
        { threshold: 100, bonusType: "fixed", bonusValue: 50 }, // $100+ purchase: +50 points
        { threshold: 250, bonusType: "fixed", bonusValue: 150 }, // $250+ purchase: +150 points
        { threshold: 500, bonusType: "percentage", bonusValue: 25 }, // $500+ purchase: +25% points
      ],

      // Category-specific bonuses
      categoryBonuses: {
        // Example: gaming-consoles category gets 2x points
        // '60f5e5b3c2e4a32d8453a2b1': { type: 'multiplier', value: 2 }
      },

      // Special promotions
      promotions: [
        // Example: Double points weekend
        // { id: 'double-weekend', active: true, type: 'multiplier', value: 2 }
      ],
    };
  }
}

module.exports = new LoyaltyPointsService();
