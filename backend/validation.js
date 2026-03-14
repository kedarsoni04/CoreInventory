const Joi = require('joi');

// User validation schemas
const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('manager', 'operator').default('manager')
});

const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  role: Joi.string().valid('manager', 'operator')
});

// Product validation schemas
const productSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  sku: Joi.string().min(1).max(50).required(),
  category: Joi.string().max(100).default('General'),
  unit: Joi.string().max(20).default('pcs'),
  reorder_point: Joi.number().min(0).default(0),
  initial_stock: Joi.number().min(0),
  location_id: Joi.string().uuid()
});

const productUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(200),
  sku: Joi.string().min(1).max(50),
  category: Joi.string().max(100),
  unit: Joi.string().max(20),
  reorder_point: Joi.number().min(0)
});

// Warehouse validation
const warehouseSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  short_code: Joi.string().min(1).max(10).required(),
  address: Joi.string().max(200)
});

// Location validation
const locationSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  short_code: Joi.string().min(1).max(10).required(),
  warehouse_id: Joi.string().uuid().required()
});

// Receipt validation
const receiptSchema = Joi.object({
  supplier: Joi.string().max(100).allow(''),
  warehouse_id: Joi.string().uuid().required(),
  warehouse: Joi.string().max(100).allow(''),
  scheduled_date: Joi.date().allow(null, ''),
  notes: Joi.string().max(500).allow(''),
  items: Joi.array().items(Joi.object({
    product_id: Joi.string().uuid().required(),
    qty_expected: Joi.number().min(0).required()
  }))
});

// Delivery validation
const deliverySchema = Joi.object({
  customer: Joi.string().max(100).allow(''),
  warehouse_id: Joi.string().uuid().required(),
  warehouse: Joi.string().max(100).allow(''),
  scheduled_date: Joi.date().allow(null, ''),
  notes: Joi.string().max(500).allow(''),
  items: Joi.array().items(Joi.object({
    product_id: Joi.string().uuid().required(),
    qty_expected: Joi.number().min(0).required()
  }))
});

// Transfer validation
const transferSchema = Joi.object({
  from_location_id: Joi.string().uuid().required(),
  to_location_id: Joi.string().uuid().required(),
  scheduled_date: Joi.date().allow(null, ''),
  notes: Joi.string().max(500).allow(''),
  items: Joi.array().items(Joi.object({
    product_id: Joi.string().uuid().required(),
    qty: Joi.number().min(0).required()
  }))
});

// Adjustment validation
const adjustmentSchema = Joi.object({
  location_id: Joi.string().uuid().required(),
  notes: Joi.string().max(500).allow(''),
  items: Joi.array().items(Joi.object({
    product_id: Joi.string().uuid().required(),
    qty_counted: Joi.number().min(0).required()
  }))
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

module.exports = {
  validate,
  userSchema,
  userUpdateSchema,
  productSchema,
  productUpdateSchema,
  warehouseSchema,
  locationSchema,
  receiptSchema,
  deliverySchema,
  transferSchema,
  adjustmentSchema
};