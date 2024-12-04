import Stripe from 'stripe';

type PriceType = 'recurring' | 'one_time';
type PriceInterval = 'month' | 'year' | 'one_time';

interface Price {
  amount: number;
  type: PriceType;
  interval: PriceInterval;
  trialPeriodDays?: number;
}

interface Product {
  name: string;
  id: string;
  prices: Record<string, Price>;
  features: string[];
}

type Config = {
  products: Record<string, Product>;
  webhooks: {
    endpoint: string;
    events: string[];
  };
};

// Enhanced types that add the checkout methods
type EnhancedPrice = Price & {
  createCheckout: (params: {
    params: Stripe.Checkout.SessionCreateParams;
    options?: { customDomain?: string };
  }) => Promise<string>;
};

type EnhancedProduct = Omit<Product, 'prices'> & {
  prices: Record<string, EnhancedPrice>;
};

export type SRM = {
  products: Record<string, EnhancedProduct>;
};

export const createSRM = (config: Config, stripe: Stripe): SRM => {
  const createCheckoutSession = async (
    productId: string,
    priceDetails: Price,
    { params, options }: {
      params: Stripe.Checkout.SessionCreateParams;
      options?: { customDomain?: string };
    }
  ) => {
    const session = await stripe.checkout.sessions.create({
      ...params,
      mode: priceDetails.type === 'recurring' ? 'subscription' : 'payment',
      ...(priceDetails.trialPeriodDays && {
        subscription_data: { trial_period_days: priceDetails.trialPeriodDays }
      })
    });

    return session.url || '';
  };

  // Enhance each price with a checkout method
  const enhanceProduct = (productId: string, product: Product): EnhancedProduct => ({
    ...product,
    prices: Object.fromEntries(
      Object.entries(product.prices).map(([priceId, price]) => [
        priceId,
        {
          ...price,
          createCheckout: (params) => createCheckoutSession(productId, price, params)
        }
      ])
    )
  });

  // Create the final SRM object
  return {
    products: Object.fromEntries(
      Object.entries(config.products).map(([productId, product]) => [
        productId,
        enhanceProduct(productId, product)
      ])
    )
  };
};
