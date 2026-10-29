/** What to tell someone when Supabase turns down a sign-up or log-in, keyed by its error code. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "That email and password don't match. Check them and try again.",
  email_not_confirmed: "Confirm your email first. Open the link we sent you, then log in.",
  user_already_exists: "There's already an account with that email. Log in instead.",
  weak_password: "Choose a stronger password: at least 8 characters.",
  over_email_send_rate_limit: "Too many emails sent. Wait a few minutes and try again.",
  over_request_rate_limit: "Too many tries. Wait a few minutes and try again.",
};

const FALLBACK = "Something went wrong. Check your connection and try again.";

export function authErrorMessage(code: string | undefined): string {
  return (code && AUTH_ERROR_MESSAGES[code]) || FALLBACK;
}

/** Messages for ?error= on the log-in page, set when a link or Google sign-in fails. */
const URL_ERROR_MESSAGES: Record<string, string> = {
  link: "That link has expired or was already used. Log in, or sign up again for a new link.",
  google: "Google sign-in didn't finish. Try again.",
};

export function urlErrorMessage(error: string | null): string | null {
  return error ? (URL_ERROR_MESSAGES[error] ?? null) : null;
}
