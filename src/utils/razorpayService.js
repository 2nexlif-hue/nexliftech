import { doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { sendSubscriptionConfirmationEmail } from './botanyEmailService';

/**
 * Dynamically loads the Razorpay checkout script if not already loaded
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Initiates Razorpay checkout for Botany Test Series
 */
export async function initiateRazorpayPayment({
  planType = 'full_series',
  planTitle = 'Botany Assistant Professor Entrance Test Series',
  unitId = null,
  amountInINR = 1499,
  user,
  razorpayKeyId = '',
  onSuccess,
  onFailure
}) {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    onFailure?.(new Error('Unable to connect to Razorpay secure checkout. Please check your internet connection.'));
    return;
  }

  // Use configured key from admin settings, environment, or registered live key
  const activeKey = razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TGUYt8AMIuHwLa';

  // If in local development without a valid live key format, allow simulated payment verification
  const isSimulation = (activeKey === 'rzp_test_placeholder' || !activeKey) && import.meta.env.DEV;

  if (isSimulation) {
    console.warn('Razorpay Live Key ID is not configured yet. Providing simulated checkout verification.');
    const proceedSim = window.confirm(
      `[SIMULATION MODE]\nNo live Razorpay Key configured yet in Admin Settings.\n\nSimulate successful payment for:\n${planTitle} - ₹${amountInINR}?\n(Click OK to simulate success, Cancel to abort)`
    );
    if (!proceedSim) {
      onFailure?.(new Error('Payment was cancelled by user.'));
      return;
    }

    const simPaymentId = `pay_sim_${Date.now()}`;
    const simOrderId = `order_sim_${Date.now()}`;

    try {
      const subscriptionRecord = await recordSuccessfulSubscription({
        paymentId: simPaymentId,
        orderId: simOrderId,
        amount: amountInINR,
        planType,
        planTitle,
        unitId,
        user
      });
      onSuccess?.(subscriptionRecord);
    } catch (err) {
      onFailure?.(err);
    }
    return;
  }

  const options = {
    key: activeKey,
    amount: Math.round(amountInINR * 100), // Razorpay accepts in paise
    currency: 'INR',
    name: 'NexLifTech Education',
    description: planTitle,
    image: '/assets/logo.png',
    prefill: {
      name: user.displayName || '',
      email: user.email || '',
      contact: user.phoneNumber || ''
    },
    theme: {
      color: '#047857' // Official Emerald Botany Theme
    },
    handler: async function (response) {
      try {
        const subscriptionRecord = await recordSuccessfulSubscription({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id || `order_${Date.now()}`,
          amount: amountInINR,
          planType,
          planTitle,
          unitId,
          user
        });
        onSuccess?.(subscriptionRecord);
      } catch (err) {
        onFailure?.(err);
      }
    },
    modal: {
      ondismiss: function () {
        onFailure?.(new Error('Payment checkout window was closed.'));
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (response) {
    onFailure?.(new Error(response.error?.description || 'Payment processing failed.'));
  });
  rzp.open();
}

/**
 * Records verified subscription in Firestore, grants access, and dispatches confirmation email
 */
async function recordSuccessfulSubscription({ paymentId, orderId, amount, planType, planTitle, unitId, user }) {
  const subId = `sub_${user.uid}_${Date.now()}`;
  const now = new Date().toISOString();

  const subData = {
    subscriptionId: subId,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName || user.email.split('@')[0],
    planType,
    planTitle,
    allowedUnits: planType === 'full_series' ? ['all'] : [unitId],
    amountPaid: amount,
    currency: 'INR',
    razorpayPaymentId: paymentId,
    razorpayOrderId: orderId,
    status: 'active',
    activatedAt: now,
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 months access
  };

  // 1. Write to global subscriptions collection
  const subDocRef = doc(db, 'subscriptions', subId);
  await setDoc(subDocRef, subData);

  // 2. Add reference in user's profile
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      activeSubscriptions: arrayUnion(subId),
      hasActiveBotanySeries: true,
      lastPurchasedAt: now
    });
  } catch (err) {
    console.warn('Could not update user doc subscriptions array:', err);
  }

  // 3. Dispatch anti-spam transactional confirmation email
  try {
    await sendSubscriptionConfirmationEmail(subData);
  } catch (emailErr) {
    console.warn('Could not dispatch confirmation email:', emailErr);
  }

  return subData;
}
