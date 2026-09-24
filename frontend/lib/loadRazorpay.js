/**
 * Loads the Razorpay checkout.js script once and returns a promise.
 * Save as frontend/lib/loadRazorpay.js
 */
let razorpayPromise = null;

export function loadRazorpay() {
  if (razorpayPromise) return razorpayPromise;
  razorpayPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return razorpayPromise;
}
