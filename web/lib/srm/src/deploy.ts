import path from "path";
import fs from "fs";
import Stripe from "stripe";
import dotenv from "dotenv";
import { PreSRMConfig } from "./types";

// Load environment variables from .env file
dotenv.config();

export async function deploy(configPath: string = "srm.config.ts"): Promise<void> {
  console.log("Starting deployment process...");

  const resolvedConfigPath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(resolvedConfigPath)) {
    throw new Error(`Configuration file not found: ${resolvedConfigPath}`);
  }

  const { config } = await import(resolvedConfigPath);
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("Stripe secret key not found.");
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
  console.log("Deploying configuration to Stripe...");

  const priceIdMapping: Record<string, any> = {};
  await syncProductsAndPrices(stripe, config, priceIdMapping);

  if (config.webhooks) {
    await deployWebhooks(stripe, config.webhooks);
  }

  console.log("Configuration deployed successfully.");
}

async function syncProductsAndPrices(
  stripe: Stripe,
  config: PreSRMConfig,
  priceIdMapping: Record<string, any>
): Promise<void> {
  console.log("Synchronizing products and prices...");

  for (const [productKey, productConfig] of Object.entries(config.products)) {
    const productData = {
      name: productConfig.name,
      metadata: { srm_product_key: productKey },
      tax_code: productConfig.taxCode || 'default',
    };

    const existingProducts = await stripe.products.list({ limit: 100 });
    let product = existingProducts.data.find(p => p.metadata.srm_product_key === productKey);

    if (!product) {
      product = await stripe.products.create(productData);
      console.log(`Created product: ${product.name}`);
    } else {
      product = await stripe.products.update(product.id, productData);
      console.log(`Updated product: ${product.name}`);
    }

    priceIdMapping[productKey] = { productId: product.id, prices: {} };
    await syncPrices(stripe, product, productConfig.prices, priceIdMapping, productKey);
  }
  console.log("All products synchronized.");
}

async function syncPrices(
  stripe: Stripe,
  product: Stripe.Product,
  pricesConfig: Record<string, any>,
  priceIdMapping: Record<string, any>,
  productKey: string
): Promise<void> {
  console.log(`Synchronizing prices for product: ${product.name}`);

  for (const [priceKey, priceConfig] of Object.entries(pricesConfig)) {
    const existingPrices = await stripe.prices.list({ product: product.id, limit: 100 });
    let price = existingPrices.data.find(p => p.metadata.srm_price_key === priceKey);

    if (!price) {
      const priceParams: Stripe.PriceCreateParams = {
        product: product.id,
        unit_amount: priceConfig.amount,
        currency: "usd",
        metadata: { srm_price_key: priceKey },
        tax_behavior: 'exclusive',
        recurring: priceConfig.type === "recurring" ? { interval: priceConfig.interval } : undefined,
      };

      price = await stripe.prices.create(priceParams);
      console.log(`Created price: ${price.unit_amount / 100} ${priceConfig.type}`);
    } else {
      console.log(`Price already exists: ${price.unit_amount / 100} ${priceConfig.type}`);
    }

    priceIdMapping[productKey].prices[priceKey] = price.id;
  }
  console.log(`All prices synchronized for product: ${product.name}`);
}

async function deployWebhooks(stripe: Stripe, webhooksConfig: PreSRMConfig['webhooks']) {
  console.log("Deploying webhooks...");

  const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 });
  const existingEndpoint = existingWebhooks.data.find(wh => wh.url === webhooksConfig.endpoint);

  if (!existingEndpoint) {
    await stripe.webhookEndpoints.create({
      url: webhooksConfig.endpoint,
      enabled_events: webhooksConfig.events,
      api_version: '2024-06-20',
    });
    console.log(`Created new webhook endpoint: ${webhooksConfig.endpoint}`);
  } else {
    await stripe.webhookEndpoints.update(existingEndpoint.id, {
      enabled_events: webhooksConfig.events,
    });
    console.log(`Updated existing webhook endpoint: ${webhooksConfig.endpoint}`);
  }
}
