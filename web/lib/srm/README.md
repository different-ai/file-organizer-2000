# SRM (Stripe Resource Manager) CLI Tool

SRM is a command-line interface tool designed to simplify the management of Stripe resources, particularly for handling products, prices, and checkout sessions.

## Features

- Deploy product and price configurations to Stripe
- Pull existing configurations from Stripe
- Create subscription and one-time payment checkout sessions
- TypeScript support for configuration files
- Environment variable management

## Installation

```bash
npm install -g srm
```

## Usage

### Configuration

Create a `srm.config.ts` file in your project root:

```typescript
import { PreSRMConfig } from "srm";
import { taxCodes } from "srm";

export const config = {
  features: {
    basicAnalytics: 'Basic Analytics',
    aiReporting: 'AI Reporting',
  },
  products: {
    hobby: {
      name: 'Hobby Plan',
      id: 'hobby',
      taxCode: taxCodes.SOFTWARE_AS_A_SERVICE,
      prices: {
        monthly: {
          amount: 1000,
          interval: 'month',
          type: 'recurring',
        },
        lifetime: {
          amount: 20000,
          interval: 'one_time',
          type: 'one_time',
        },
      },
      features: ['basicAnalytics'],
    },
    // ... other products
  },
} satisfies PreSRMConfig;
```

### Commands

1. Deploy configuration to Stripe:
   ```
   srm deploy [--config <path>] [--env <path>]
   ```

2. Pull configuration from Stripe:
   ```
   srm pull [--config <path>] [--env <path>]
   ```

Options:
- `--config <path>`: Specify a custom path for the configuration file (default: `srm.config.ts`)
- `--env <path>`: Specify a custom path for the .env file (default: `.env`)

### Environment Variables

Create a `.env` file in your project root:

```
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

## Programmatic Usage

You can also use SRM programmatically in your TypeScript/JavaScript projects:

```typescript
import { createSRM } from 'srm';
import Stripe from 'stripe';
import { config } from './srm.config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const srm = createSRM(config, { stripe });

// Create a subscription checkout URL
const subscriptionUrl = await srm.products.enterprise.prices.annual.createSubscriptionCheckoutUrl({
  userId: "user123",
  successUrl: "http://example.com/success",
  cancelUrl: "http://example.com/cancel",
});

// Create a one-time payment checkout URL
const oneTimeUrl = await srm.products.hobby.prices.lifetime.createOneTimePaymentCheckoutUrl({
  userId: "user456",
  successUrl: "http://example.com/success",
  cancelUrl: "http://example.com/cancel",
});
```

## Development

To run the CLI tool locally during development:

```bash
npm run srm -- <command> [options]
```

## License

MIT
