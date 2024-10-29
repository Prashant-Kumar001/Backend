import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const subscriptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId,
    ref: 'User',  // References the User model
    required: true
  },
  channel:{
    type: Schema.Types.ObjectId,
    ref: 'Channel',  // References the Channel model
    required: true
  },
  // plan: {
  //   type: String,
  //   enum: ['basic', 'premium', 'pro'],  // Subscription plans
  //   required: true
  // },
  // startDate: {
  //   type: Date,
  //   default: Date.now  // Start date of the subscription
  // },
  // endDate: {
  //   type: Date,
  //   required: true  // End date of the subscription
  // },
  // status: {
  //   type: String,
  //   enum: ['active', 'inactive', 'canceled', 'expired'],
  //   default: 'active'  // Current status of the subscription
  // },
  // paymentDetails: {
  //   method: {
  //     type: String,
  //     enum: ['credit_card', 'paypal', 'bank_transfer'],  // Payment method
  //     required: true
  //   },
  //   lastPaymentDate: {
  //     type: Date,
  //     default: Date.now
  //   },
  //   nextPaymentDate: {
  //     type: Date
  //   },
  //   amount: {
  //     type: Number,
  //     required: true
  //   }
  // },
  // autoRenew: {
  //   type: Boolean,
  //   default: true  // Indicates if the subscription auto-renews
  // }
});

// Create the Subscription model
const Subscription = model('Subscription', subscriptionSchema);

export default Subscription;
