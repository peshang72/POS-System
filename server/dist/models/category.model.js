const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      en: {
        type: String,
        required: [true, "Please add a category name in English"],
        trim: true,
        maxlength: [50, "Name cannot be more than 50 characters"],
      },
      ku: {
        type: String,
        trim: true,
        maxlength: [50, "Name cannot be more than 50 characters"],
      },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    level: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    path: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    image: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/|\/)/i.test(v);
        },
        message: (props) => `${props.value} is not a valid URL`,
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for child categories
CategorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
  justOne: false,
});

// Pre-save middleware to set level and path
CategorySchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("parent")) {
    if (!this.parent) {
      // This is a root category
      this.level = 0;
      this.path = [];
    } else {
      const parentCategory = await this.constructor.findById(this.parent);
      if (!parentCategory) {
        return next(new Error("Parent category not found"));
      }
      this.level = parentCategory.level + 1;
      this.path = [...parentCategory.path, parentCategory._id];
    }
  }
  next();
});

// Create index for name
CategorySchema.index({ "name.en": "text", "name.ku": "text" });
CategorySchema.index({ parent: 1 });
CategorySchema.index({ level: 1 });
CategorySchema.index({ active: 1 });
CategorySchema.index({ path: 1 });

// Static method to get category tree
CategorySchema.statics.getCategoryTree = async function () {
  const rootCategories = await this.find({ parent: null })
    .sort("name.en")
    .populate({
      path: "children",
      populate: {
        path: "children",
      },
    });

  return rootCategories;
};

// Static method to get all descendants of a category
CategorySchema.statics.getDescendants = async function (categoryId) {
  return await this.find({ path: categoryId });
};

module.exports = mongoose.model("Category", CategorySchema);
