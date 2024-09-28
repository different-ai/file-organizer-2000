import { createSRM } from "@u22n/srm";
import { config } from "../srm.config";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

type Config = typeof config;
const srm = createSRM<Config>(config, { stripe });

export default srm;