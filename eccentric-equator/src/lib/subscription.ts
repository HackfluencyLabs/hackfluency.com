const SUPABASE_URL = "https://yfofmawbvlontugygfcj.supabase.co/rest/v1/emails";
const SUPABASE_ANON_KEY = "sb_publishable_EFI12D4AaO2Y7o5gyWrB-g_i--T5Arz";
const MAX_EMAIL_LENGTH = 254;

export function sanitizeEmail(email: string): string {
  email = email.trim();
  email = email.replace(/[^a-zA-Z0-9@._-]/g, '');
  return email;
}

export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return { valid: false, error: `Email exceeds ${MAX_EMAIL_LENGTH} characters` };
  }
  if (!validateEmailFormat(email)) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true };
}

export interface SubscribeResult {
  success: boolean;
  message: string;
}

export async function subscribeEmail(email: string): Promise<SubscribeResult> {
  const sanitized = sanitizeEmail(email);
  const validation = validateEmail(sanitized);
  
  if (!validation.valid) {
    return { success: false, message: validation.error || "Invalid email" };
  }

  try {
    const response = await fetch(SUPABASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ email: sanitized }),
    });

    if (response.status === 201 || response.status === 204) {
      return { success: true, message: "Successfully subscribed!" };
    }
    if (response.status === 409) {
      return { success: false, message: "Already subscribed." };
    }
    return { success: false, message: "Error. Please try again." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Network error. Check connection." };
  }
}
