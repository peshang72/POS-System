const Customer = require("../models/customer.model");

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Private
 */
exports.getCustomers = async (req, res) => {
  try {
    // Allow filtering and pagination
    const filter = {};
    if (req.query.active) {
      filter.active = req.query.active === "true";
    }

    // Allow searching
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = (page - 1) * limit;

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(filter);

    // Return just the array for compatibility with frontend
    res.status(200).json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * @desc    Get single customer
 * @route   GET /api/customers/:id
 * @access  Private
 */
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Return just the customer object for frontend compatibility
    res.status(200).json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);

    // Check if error is a valid ObjectID error
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * @desc    Create a customer
 * @route   POST /api/customers
 * @access  Private
 */
exports.createCustomer = async (req, res) => {
  try {
    // Check if the phone number is already in use
    const existingCustomer = await Customer.findOne({ phone: req.body.phone });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: "Phone number already in use",
      });
    }

    // Check if email is provided and already in use
    if (req.body.email) {
      const emailExists = await Customer.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: "Email already in use",
        });
      }
    }

    const customer = await Customer.create(req.body);

    // Return just the customer object
    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);

    // Validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * @desc    Update a customer
 * @route   PUT /api/customers/:id
 * @access  Private
 */
exports.updateCustomer = async (req, res) => {
  try {
    // Make sure the customer exists
    let customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Check if the phone number is being changed and already exists
    if (req.body.phone && req.body.phone !== customer.phone) {
      const phoneExists = await Customer.findOne({ phone: req.body.phone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          error: "Phone number already in use",
        });
      }
    }

    // Check if email is being changed and already exists
    if (req.body.email && req.body.email !== customer.email) {
      const emailExists = await Customer.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: "Email already in use",
        });
      }
    }

    // Update the customer
    customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Return just the customer object
    res.status(200).json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);

    // Check if error is a valid ObjectID error
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID",
      });
    }

    // Validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * @desc    Delete a customer
 * @route   DELETE /api/customers/:id
 * @access  Private
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    await Customer.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Error deleting customer:", error);

    // Check if error is a valid ObjectID error
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * @desc    Get customer transactions
 * @route   GET /api/customers/:id/transactions
 * @access  Private (Admin, Manager)
 */
exports.getCustomerTransactions = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Populate transactions
    await customer.populate({
      path: "transactions",
      options: { sort: { transactionDate: -1 } },
    });

    res.status(200).json({
      success: true,
      count: customer.transactions.length,
      data: customer.transactions,
    });
  } catch (error) {
    console.error("Error fetching customer transactions:", error);

    // Check if error is a valid ObjectID error
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};
