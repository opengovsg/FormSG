import { paymentConfig } from '../config/features/payment.config'
import Stripe from 'stripe'

export const stripe = new Stripe(paymentConfig.stripeSecretKey, {
    apiVersion: '2022-11-15',
});