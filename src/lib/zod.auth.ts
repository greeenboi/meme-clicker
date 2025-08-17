import { z } from "zod";

// Branded primitive types for stronger typing when parsed
export type Email = z.infer<typeof emailSchema>;
export type Username = z.infer<typeof usernameSchema>;
export type Password = z.infer<typeof passwordSchema>;

// Field schemas
export const emailSchema = z
	.string()
	.transform((s) => s.trim().toLowerCase())
	.pipe(
		z
			.string()
			.min(1, "Email is required")
			.max(254, "Email is too long")
			.email("Please enter a valid email address")
			.refine((v) => Array.from(v).every((ch) => ch.charCodeAt(0) <= 0x7f), {
				message: "Email must be ASCII only",
			}),
	);

export const usernameSchema = z
	.string()
	.transform((s) => s.normalize("NFKC"))
	.transform((s) => s.trim().toLowerCase())
	.pipe(
		z
			.string()
			.min(3, "Username must be at least 3 characters")
			.max(20, "Username must be at most 20 characters")
			// no leading/trailing underscore, no double underscores, ascii set only, not all digits
			.regex(/^(?!_)(?!.*__)(?!\d+$)[a-z0-9_]+(?<!_)$/, {
				message:
					"Username must be lowercase letters, numbers, underscores; no leading/trailing or double underscores; not all digits",
			}),
	);

export const passwordSchema = z
	.string()
	.min(12, "Password must be at least 12 characters")
	.max(128, "Password is too long")
	.refine((v) => !/\s/.test(v), {
		message: "Password cannot contain whitespace",
	})
	.refine((v) => /[a-z]/.test(v), {
		message: "Password must include at least one lowercase letter",
	})
	.refine((v) => /[A-Z]/.test(v), {
		message: "Password must include at least one uppercase letter",
	})
	.refine((v) => /\d/.test(v), {
		message: "Password must include at least one number",
	})
	.refine((v) => /[^A-Za-z0-9]/.test(v), {
		message: "Password must include at least one symbol",
	});

// Compound schemas
export const signUpSchema = z
	.object({
		email: emailSchema,
		username: usernameSchema,
		password: passwordSchema,
	})
	.superRefine((val, ctx) => {
		const p = val.password.toLowerCase();
		const uname = val.username.toLowerCase();
		const emailLocal = val.email.toLowerCase().split("@")[0] ?? "";
		if (uname && p.includes(uname)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["password"],
				message: "Password must not contain your username",
			});
		}
		if (emailLocal && p.includes(emailLocal)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["password"],
				message: "Password must not contain your email name",
			});
		}
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
