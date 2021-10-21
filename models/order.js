const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  products: [
    {
      product: { type: Object, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  user: {
    email: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  }
});

orderSchema.methods.clearOrders = function() {
  this.products = [];
  return this.save();
}

orderSchema.methods.kazkas = function() {
  console.log("amen");
};

module.exports = mongoose.model('Order', orderSchema);
