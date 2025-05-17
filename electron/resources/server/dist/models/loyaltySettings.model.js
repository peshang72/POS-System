const mongoose = require("mongoose");

const LoyaltySettingsSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    pointsPerDollar: {
      type: Number,
      default: 10,
      min: 0,
    },
    redemptionRate: {
      type: Number,
      default: 0.01,
      min: 0,
    },
    minimumPoints: {
      type: Number,
      default: 1,
      min: 0,
    },
    minimumRedemption: {
      type: Number,
      default: 100,
      min: 0,
    },
    maximumRedemptionValue: {
      type: Number,
      default: 100,
      min: 0,
    },
    expirationPeriod: {
      type: Number,
      default: 365, // Days
      min: 0,
    },
    statusTiers: {
      silver: {
        type: Number,
        default: 500,
      },
      gold: {
        type: Number,
        default: 1000,
      },
      platinum: {
        type: Number,
        default: 5000,
      },
    },
    statusMultipliers: {
      standard: {
        type: Number,
        default: 1,
      },
      silver: {
        type: Number,
        default: 1.1,
      },
      gold: {
        type: Number,
        default: 1.2,
      },
      platinum: {
        type: Number,
        default: 1.5,
      },
    },
    tiers: [
      {
        threshold: {
          type: Number,
          required: true,
        },
        bonusType: {
          type: String,
          enum: ["fixed", "percentage"],
          required: true,
        },
        bonusValue: {
          type: Number,
          required: true,
        },
      },
    ],
    categoryBonuses: {
      type: Map,
      of: {
        type: {
          type: String,
          enum: ["multiplier", "fixed"],
        },
        value: Number,
      },
    },
    promotions: [
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        active: {
          type: Boolean,
          default: true,
        },
        type: {
          type: String,
          enum: ["multiplier", "fixed"],
          required: true,
        },
        value: {
          type: Number,
          required: true,
        },
        startDate: Date,
        endDate: Date,
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Find one convenience method
LoyaltySettingsSchema.statics.findSettings = async function () {
  let settings = await this.findOne();

  if (!settings) {
    settings = await this.create({});
  }

  return settings;
};

module.exports = mongoose.model("LoyaltySettings", LoyaltySettingsSchema);
