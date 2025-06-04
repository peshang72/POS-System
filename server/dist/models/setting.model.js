const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    dataType: {
      type: String,
      required: true,
      enum: ["string", "number", "boolean", "object", "array"],
      default: "string",
    },
    description: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for category and key
SettingSchema.index({ category: 1, key: 1 }, { unique: true });
SettingSchema.index({ category: 1 });
SettingSchema.index({ key: 1 });

// Validation middleware to verify data type
SettingSchema.pre("save", function (next) {
  const errors = [];

  switch (this.dataType) {
    case "string":
      if (typeof this.value !== "string") {
        errors.push("Value must be a string");
      }
      break;
    case "number":
      if (typeof this.value !== "number") {
        errors.push("Value must be a number");
      }
      break;
    case "boolean":
      if (typeof this.value !== "boolean") {
        errors.push("Value must be a boolean");
      }
      break;
    case "object":
      if (
        typeof this.value !== "object" ||
        Array.isArray(this.value) ||
        this.value === null
      ) {
        errors.push("Value must be an object");
      }
      break;
    case "array":
      if (!Array.isArray(this.value)) {
        errors.push("Value must be an array");
      }
      break;
  }

  if (errors.length > 0) {
    return next(new Error(errors.join(", ")));
  }

  next();
});

// Static method to get a setting value by category and key
SettingSchema.statics.getValue = async function (
  category,
  key,
  defaultValue = null
) {
  const setting = await this.findOne({ category, key });

  if (!setting) {
    return defaultValue;
  }

  return setting.value;
};

// Static method to set a setting value
SettingSchema.statics.setValue = async function (
  category,
  key,
  value,
  dataType,
  userId,
  description = null
) {
  const setting = await this.findOneAndUpdate(
    { category, key },
    {
      value,
      dataType,
      description,
      updatedBy: userId,
    },
    {
      new: true,
      upsert: true,
    }
  );

  return setting;
};

// Static method to get all settings in a category
SettingSchema.statics.getCategory = async function (category) {
  const settings = await this.find({ category });
  return settings.reduce((result, setting) => {
    result[setting.key] = setting.value;
    return result;
  }, {});
};

module.exports = mongoose.model("Setting", SettingSchema);
