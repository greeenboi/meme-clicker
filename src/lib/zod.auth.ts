import { z } from "zod";

// Branded primitive types for stronger typing when parsed
export type Email = z.infer<typeof emailSchema>;
export type Username = z.infer<typeof usernameSchema>;
export type Password = z.infer<typeof passwordSchema>;

// Field schemas
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .transform((e) => e.toLowerCase());

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can contain letters, numbers, and underscores only",
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .refine((v) => /[A-Za-z]/.test(v), {
    message: "Password must include at least one letter",
  })
  .refine((v) => /\d/.test(v), {
    message: "Password must include at least one number",
  });

// Compound schemas
export const signUpSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function validateSignUp(input: unknown) {
  return signUpSchema.safeParse(input);
}

export function validateLogin(input: unknown) {
  return loginSchema.safeParse(input);
}
