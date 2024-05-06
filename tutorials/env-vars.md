# Environment Variables


## Self-hosting

### OpenAI

- `OPENAI_API_KEY`: The API key for OpenAI integration.
- `ANTHROPIC_API_KEY`: To use the Anthropic models

### Models

- `MODEL_RELATIONSHIPS`: The model to use for determining file relationships. Defaults to `"gpt-4-turbo"` if not set.
- `MODEL_TAGGING`: The model to use for file tagging. Defaults to `"gpt-4-turbo"` if not set.
- `MODEL_FOLDERS`: The model to use for determining appropriate folders for files. Defaults to `"gpt-4-turbo"` if not set. 
- `MODEL_NAME`: The model to use for generating file names. Defaults to `"gpt-4-turbo"` if not set.
- `TEXT_MODEL`: The model to use for text formatting. Defaults to `"gpt-4-turbo"` if not set.

### API Keys
This is necessary when deploying with vercel, but not required if you run it locally.

- `SOLO_API_KEY`: The API key for solo usage (without user management). 

Make sure to set these environment variables in your `.env` file or your hosting platform's configuration settings for the project to function correctly.


## Running a full instance
> The env var below are only useful if you want to add user management on your instance

### General

- `ENABLE_USER_MANAGEMENT`: Determines whether user management is enabled or not. Set to `"true"` to enable user management via Clerk. (should be set to true if you want to run the full instance)

### Stripe

- `STRIPE_SECRET_KEY`: The secret key for Stripe integration.
- `STRIPE_WEBHOOK_SECRET`: The secret key for Stripe webhook.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: The public key for Stripe integration.
- `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID`: The price ID for the monthly subscription plan in Stripe.

### Unkey

- `UNKEY_ROOT_KEY`: The root key for Unkey API.
- `UNKEY_API_ID`: The API ID for Unkey.
