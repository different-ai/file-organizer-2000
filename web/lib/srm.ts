import { createSRM } from "@u22n/srm/dist";
import { config } from "../srm.config";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15",
});

type Config = typeof config;
const srm = createSRM<Config>(config, { stripe });

export default srm;