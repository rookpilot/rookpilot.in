export type AuthMode = "signup" | "login";

export interface AuthFormValues {
  name: string;
  email: string;
  password: string;
}

export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>;
