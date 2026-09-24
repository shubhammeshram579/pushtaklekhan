import { deductCreditsLocally, openUpgradeModal } from '../store';

export async function callAI(apiFn, payload, dispatch) {
  try {
    const res = await apiFn(payload);
    
    // Safely unwrap data whether apiFn returns full Axios response or direct payload
    const data = res?.data ?? res;

    if (!data) {
      throw new Error("Empty response received from AI service.");
    }

    // Handle credit updates flexibly
    const remaining = data?.credits?.remaining ?? data?.remainingCredits;
    if (remaining !== undefined && remaining !== null) {
      dispatch(deductCreditsLocally({ remaining }));
    }

    return data;
  } catch (err) {
    // Handle 402 Payment Required (Insufficient Credits)
    if (err?.response?.status === 402) {
      const info = err.response?.data;
      const message =
        typeof info === 'object' && info?.message
          ? info.message
          : 'Insufficient credits. Please upgrade your plan.';

      dispatch(openUpgradeModal({ reason: message }));
      return null;
    }

    // Re-throw so the caller's catch block (e.g. in runAI) handles non-402 errors
    throw err;
  }
}