const mongoose = require("mongoose");
const { generateEAN13Barcode } = require("../utils/barcodeGenerator");

const ProductSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "Please add a SKU"],
      unique: true,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      index: true,
    },
    name: {
      en: {
        type: String,
        required: [true, "Please add a product name in English"],
        trim: true,
        maxlength: [100, "Name cannot be more than 100 characters"],
      },
      ku: {
        type: String,
        trim: true,
        maxlength: [100, "Name cannot be more than 100 characters"],
      },
    },
    description: {
      en: {
        type: String,
        maxlength: [500, "Description cannot be more than 500 characters"],
      },
      ku: {
        type: String,
        maxlength: [500, "Description cannot be more than 500 characters"],
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please select a category"],
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
      min: [0, "Price must be positive"],
    },
    cost: {
      type: Number,
      required: [true, "Please add a cost"],
      min: [0, "Cost must be positive"],
      default: 0,
    },
    costHistory: [
      {
        cost: {
          type: Number,
          required: true,
          min: [0, "Cost must be positive"],
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity must be positive"],
      default: 0,
    },
    reorderLevel: {
      type: Number,
      min: [0, "Reorder level must be positive"],
      default: 10,
    },
    images: [
      {
        type: String,
        validate: {
          validator: function (v) {
            return /^(https?:\/\/|\/)/i.test(v);
          },
          message: (props) => `${props.value} is not a valid URL`,
        },
      },
    ],
    attributes: {
      weight: Number,
      color: String,
      size: String,
      dimensions: {
        width: Number,
        height: Number,
        depth: Number,
        unit: {
          type: String,
          enum: ["cm", "mm", "inch"],
          default: "cm",
        },
      },
      material: String,
      manufacturer: String,
      origin: String,
      expiryDate: Date,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create a virtual "profit" property
ProductSchema.virtual("profit").get(function () {
  return this.price - this.cost;
});

// Create a virtual "profitMargin" property
ProductSchema.virtual("profitMargin").get(function () {
  if (this.price === 0) return 0;
  return ((this.price - this.cost) / this.price) * 100;
});

// Create a virtual "stockStatus" property
ProductSchema.virtual("stockStatus").get(function () {
  if (this.quantity <= 0) {
    return "Out of Stock";
  } else if (this.quantity <= this.reorderLevel) {
    return "Low Stock";
  } else {
    return "In Stock";
  }
});

// Create index for category and text search
ProductSchema.index({ category: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({
  "name.en": "text",
  "name.ku": "text",
  "description.en": "text",
  "description.ku": "text",
  tags: "text",
});

// Pre-save hook to generate barcode if not provided
ProductSchema.pre("save", async function (next) {
  if (!this.isNew || this.barcode) {
    return next();
  }

  // First, check if there is an existing product with the same SKU
  const existingProduct = await this.constructor.findOne({ sku: this.sku });

  if (existingProduct && existingProduct.barcode) {
    // Use the existing product's barcode
    this.barcode = existingProduct.barcode;
    return next();
  }

  // Generate a unique barcode for this new product type
  let isUnique = false;
  let newBarcode;

  while (!isUnique) {
    newBarcode = generateEAN13Barcode();

    // Check if this barcode already exists to avoid conflicts
    const existingBarcodeProduct = await this.constructor.findOne({
      barcode: newBarcode,
    });

    if (!existingBarcodeProduct) {
      isUnique = true;
    }
  }

  this.barcode = newBarcode;
  next();
});

module.exports = mongoose.model("Product", ProductSchema);
