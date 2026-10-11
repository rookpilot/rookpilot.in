import type { AuthFormErrors, AuthFormValues, AuthMode } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export function validateAuthForm(mode: AuthMode, values: AuthFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};

  if (mode === "signup" && !values.name.trim()) {
    errors.name = "Enter your name.";
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter an email address like you@example.com.";
  }
  if (mode === "signup" && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (mode === "login" && !values.password) {
    errors.password = "Enter your password.";
  }
  return errors;
}
