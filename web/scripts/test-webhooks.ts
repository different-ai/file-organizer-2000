import { execSync } from 'child_process';
import { db, UserUsageTable } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { PRICES, PRODUCTS } from '../srm.config';
import { setTimeout } from 'timers/promises';
import dotenv from 'dotenv';

// get .env.local
dotenv.config({ path: '.env.local' });



// Expected states for different subscription types
type ExpectedState = {
  subscriptionStatus: string;
  paymentStatus: string;
  currentProduct: string;
  currentPlan: string;
  billingCycle: string;
  maxTokenUsage: number;
};

const EXPECTED_STATES: Record<string, ExpectedState> = {
  hobby_monthly: {
    subscriptionStatus: 'active',
    paymentStatus: 'succeeded',
    currentProduct: 'subscription',
    currentPlan: 'monthly',
    billingCycle: 'monthly',
    maxTokenUsage: 5000 * 1000,
  },
  hobby_yearly: {
    subscriptionStatus: 'active',
    paymentStatus: 'succeeded',
    currentProduct: 'subscription',
    currentPlan: 'yearly',
    billingCycle: 'yearly',
    maxTokenUsage: 5000 * 1000,
  },
  lifetime: {
    subscriptionStatus: 'active',
    paymentStatus: 'succeeded',
    currentProduct: 'lifetime',
    currentPlan: 'lifetime',
    billingCycle: 'lifetime',
    maxTokenUsage: 5000 * 1000,
  },
  one_year: {
    subscriptionStatus: 'active',
    paymentStatus: 'succeeded',
    currentProduct: 'lifetime',
    currentPlan: 'one_year',
    billingCycle: 'one_year',
    maxTokenUsage: 5000 * 1000,
  },
  top_up: {
    subscriptionStatus: 'active',
    paymentStatus: 'succeeded',
    currentProduct: 'top_up',
    currentPlan: 'top_up',
    billingCycle: 'top-up',
    maxTokenUsage: 5000000, // 5M tokens
  },
};

// Helper to generate unique test user IDs
function generateTestUserId(testCase: string): string {
  return `test_${testCase}_${uuidv4().split('-')[0]}`;
}

// Helper to verify database state
async function verifyDatabaseState(userId: string, testCase: string, expectedState?: ExpectedState) {
  console.log(`\n🔍 Verifying database state for ${testCase}`);
  
  // Wait a bit for the webhook to process
  await setTimeout(1000);
  
  const userUsage = await db
    .select()
    .from(UserUsageTable)
    .where(eq(UserUsageTable.userId, userId));

  if (userUsage.length === 0) {
    console.error(`❌ No database record found for user ${userId}`);
    return null;
  }

  const record = userUsage[0];
  console.log(JSON.stringify(record, null, 2));

  if (expectedState) {
    const validationResults = validateState(record, expectedState);
    if (validationResults.length > 0) {
      console.error('❌ Validation errors:');
      validationResults.forEach(error => console.error(`   - ${error}`));
    } else {
      console.log('✅ State validation passed');
    }
  }

  return record;
}

// Helper to validate state against expectations
function validateState(actual: any, expected: ExpectedState): string[] {
  const errors: string[] = [];
  
  Object.entries(expected).forEach(([key, value]) => {
    if (actual[key] !== value) {
      errors.push(`${key}: expected ${value}, got ${actual[key]}`);
    }
  });
  
  return errors;
}

// Helper to run stripe webhook trigger
function triggerWebhook(command: string) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error('Error triggering webhook:', error);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting webhook tests...\n');

  // 1. Test HobbyMonthly Subscription
  const monthlyUserId = generateTestUserId('hobby_monthly');
  console.log('Testing HobbyMonthly Subscription...');
  triggerWebhook(`stripe trigger checkout.session.completed \
    --add checkout_session:metadata.userId=${monthlyUserId} \
    --add checkout_session:metadata.type=subscription \
    --add checkout_session:metadata.plan=monthly \
    --add checkout_session:mode=subscription \
    `);
  await verifyDatabaseState(monthlyUserId, 'HobbyMonthly Subscription');

  // 2. Test HobbyYearly Subscription
  const yearlyUserId = generateTestUserId('hobby_yearly');
  console.log('\nTesting HobbyYearly Subscription...');
  triggerWebhook(`stripe trigger checkout.session.completed \
    --add checkout_session:metadata.userId=${yearlyUserId} \
    --add checkout_session:metadata.type=subscription \
    --add checkout_session:metadata.plan=yearly \
    --add checkout_session:mode=subscription \
    `);
  await verifyDatabaseState(yearlyUserId, 'HobbyYearly Subscription', EXPECTED_STATES.hobby_yearly);

  // 3. Test Lifetime Purchase
  const lifetimeUserId = generateTestUserId('lifetime');
  console.log('\nTesting Lifetime Purchase...');
  triggerWebhook(`stripe trigger checkout.session.completed \
    --add checkout_session:metadata.userId=${lifetimeUserId} \
    --add checkout_session:metadata.type=lifetime \
    --add checkout_session:metadata.plan=lifetime \
    --add checkout_session:mode=payment \
    `);
  await verifyDatabaseState(lifetimeUserId, 'Lifetime Purchase', EXPECTED_STATES.lifetime);

  // 4. Test OneYear Purchase
  const oneYearUserId = generateTestUserId('one_year');
  console.log('\nTesting OneYear Purchase...');
  triggerWebhook(`stripe trigger checkout.session.completed \
    --add checkout_session:metadata.userId=${oneYearUserId} \
    --add checkout_session:metadata.type=lifetime \
    --add checkout_session:metadata.plan=one_year \
    --add checkout_session:mode=payment \
    `);
  await verifyDatabaseState(oneYearUserId, 'OneYear Purchase', EXPECTED_STATES.one_year);

  // 5. Test Top-up Purchase
  const topUpUserId = generateTestUserId('top_up');
  console.log('\nTesting Top-up Purchase...');
  triggerWebhook(`stripe trigger payment_intent.succeeded \
    --add payment_intent:metadata.userId=${topUpUserId} \
    --add payment_intent:metadata.type=top_up \
    --add payment_intent:metadata.tokens=5000000 \
    --add payment_intent:metadata.price_key=top_up_5m \
    --add payment_intent:metadata.product_key=top_up_5m \
    --add payment_intent:amount=1500 \
    --add payment_intent:currency=usd`);
  await verifyDatabaseState(topUpUserId, 'Top-up Purchase', EXPECTED_STATES.top_up);

  // 6. Test Subscription Update
  const updateUserId = generateTestUserId('sub_update');
  console.log('\nTesting Subscription Update...');
  // First create a subscription
  triggerWebhook(`stripe trigger checkout.session.completed \
    --add checkout_session:metadata.userId=${updateUserId} \
    --add checkout_session:metadata.type=subscription \
    --add checkout_session:metadata.plan=monthly \
    --add checkout_session:mode=subscription \
`);
  await verifyDatabaseState(updateUserId, 'Initial Subscription', EXPECTED_STATES.hobby_monthly);

  // Then update it
  triggerWebhook(`stripe trigger customer.subscription.updated \
    --add subscription:metadata.userId=${updateUserId} \
    --add subscription:metadata.type=subscription \
    --add subscription:metadata.plan=yearly \
    --add subscription:items.data.0.price.recurring.interval=year \
    --add subscription:items.data.0.price.metadata.srm_price_key=yearly`);
  await verifyDatabaseState(updateUserId, 'After Subscription Update', EXPECTED_STATES.hobby_yearly);

  // 7. Test Invoice Paid
  const invoiceUserId = generateTestUserId('invoice_paid');
  console.log('\nTesting Invoice Paid...');
  triggerWebhook(`stripe trigger invoice.paid \
    --add invoice:metadata.userId=${invoiceUserId} \
    --add invoice:metadata.type=subscription \
    --add invoice:metadata.plan=monthly \
    --add invoice:status=paid \
    --add invoice:amount_paid=${PRICES.MONTHLY} \
    --add invoice:customer_email=test@example.com`);
  await verifyDatabaseState(invoiceUserId, 'Invoice Paid', EXPECTED_STATES.hobby_monthly);

  // 8. Test Failed Payment
  const failedUserId = generateTestUserId('payment_failed');
  console.log('\nTesting Failed Payment...');
  triggerWebhook(`stripe trigger invoice.payment_failed \
    --add invoice:metadata.userId=${failedUserId} \
    --add invoice:metadata.type=subscription \
    --add invoice:status=payment_failed \
    --add invoice:customer=cus_123`);
  await verifyDatabaseState(failedUserId, 'Failed Payment', {
    subscriptionStatus: 'payment_failed',
    paymentStatus: 'payment_failed',
    currentProduct: 'subscription',
    currentPlan: 'none',
    billingCycle: 'monthly',
    maxTokenUsage: 5000 * 1000,
  });

  console.log('\n✅ All webhook tests completed!');
}

// Run the tests
runTests().catch(console.error); 