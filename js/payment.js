// ==========================================================================
// ISHITECHNO PROJECTS — Razorpay Standard Checkout
//
// This is a plain static site (no build step), so there is no bundler to
// inject environment variables into the frontend. The Razorpay KEY ID is
// safe to expose in client-side code (Razorpay's own checkout.js requires
// this) — it is NOT the secret. The KEY SECRET lives only on the server
// (trackers/functions/.env) and is used exclusively inside the Cloud
// Functions in trackers/functions/index.js.
//
// If you ever move this site to Next.js / Vite / CRA, replace the constant
// below with the framework's public env var instead:
//   Next.js: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
//   Vite:    import.meta.env.VITE_RAZORPAY_KEY_ID
//   CRA:     process.env.REACT_APP_RAZORPAY_KEY_ID
// ==========================================================================

// Base URL of the deployed Cloud Functions. Default Firebase region is
// us-central1 unless you called .region() when deploying — update this if
// your functions are deployed to a different region.
const FUNCTIONS_BASE_URL = "https://us-central1-ishitrackers.cloudfunctions.net";

/**
 * Kicks off a Razorpay Standard Checkout payment.
 * @param {Object} opts
 * @param {number} opts.amountRupees - amount to charge, in rupees (e.g. 499)
 * @param {string} [opts.description] - shown inside the Razorpay modal
 * @param {Object} [opts.prefill] - { name, email, contact }
 * @param {Object} [opts.notes] - optional metadata stored with the payment
 * @param {function} [opts.onSuccess] - called with the verify response on success
 * @param {function} [opts.onError] - called with an Error on failure/cancel
 */
function startRazorpayCheckout(opts) {
  const {
    amountRupees,
    description = "Payment to Ishitechno Projects",
    prefill = {},
    notes = {},
    onSuccess = function () {},
    onError = function () {}
  } = opts || {};

  const amountPaise = Math.round(Number(amountRupees) * 100);

  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    onError(new Error("Please enter a valid amount (minimum ₹1)."));
    return;
  }

  if (typeof Razorpay === "undefined") {
    onError(new Error("Payment gateway failed to load. Please check your internet connection and try again."));
    return;
  }

  fetch(FUNCTIONS_BASE_URL + "/createRazorpayOrder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    })
  })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || "Could not start payment. Please try again.");
        return data;
      });
    })
    .then(function (order) {
      const rzp = new Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Ishitechno Projects",
        description: description,
        order_id: order.order_id,
        prefill: prefill,
        notes: notes,
        theme: { color: "#1e6fd9" },
        handler: function (response) {
          // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
          fetch(FUNCTIONS_BASE_URL + "/verifyRazorpayPayment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.assign({}, response, { notes: notes }))
          })
            .then(function (res) {
              return res.json().then(function (data) {
                if (!res.ok || !data.success) throw new Error(data.error || "Payment verification failed.");
                return data;
              });
            })
            .then(onSuccess)
            .catch(onError);
        },
        modal: {
          ondismiss: function () {
            onError(new Error("Payment cancelled."));
          }
        }
      });

      rzp.on("payment.failed", function (response) {
        onError(new Error(response?.error?.description || "Payment failed. Please try again."));
      });

      rzp.open();
    })
    .catch(onError);
}
