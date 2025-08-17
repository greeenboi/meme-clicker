import { type FormEvent, useState } from "react";
import { type AuthToken, login, signUp } from "../lib/auth";
import {
	type LoginInput,
	type SignUpInput,
	loginSchema,
	signUpSchema,
} from "../lib/zod.auth";
import { swampPanel } from "../types/swamp";

export default function AuthPanel({
	onAuthed,
}: { onAuthed: (u: AuthToken) => void }) {
	const [mode, setMode] = useState<"login" | "signup">("signup");
	const [email, setEmail] = useState<string>("");
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<
		Partial<Record<"email" | "username" | "password", string>>
	>({});
	const [loading, setLoading] = useState(false);

	const submit = async (e?: FormEvent) => {
		e?.preventDefault();
		try {
			setLoading(true);
			setError(null);
			setFieldErrors({});

			// Client-side Zod validation per mode
			if (mode === "signup") {
				const parsed = signUpSchema.safeParse({ email, username, password });
				if (!parsed.success) {
					const fe: Partial<Record<"email" | "username" | "password", string>> =
						{};
					for (const issue of parsed.error.issues) {
						const k =
							(issue.path[0] as "email" | "username" | "password") ?? "email";
						if (!fe[k]) fe[k] = issue.message;
					}
					setFieldErrors(fe);
					return;
				}
				const norm: SignUpInput = parsed.data;
				const user = await signUp(norm.email, norm.username, norm.password);
				onAuthed(user);
			} else {
				const parsed = loginSchema.safeParse({ email, password });
				if (!parsed.success) {
					const fe: Partial<Record<"email" | "username" | "password", string>> =
						{};
					for (const issue of parsed.error.issues) {
						const k =
							(issue.path[0] as "email" | "username" | "password") ?? "email";
						if (!fe[k]) fe[k] = issue.message;
					}
					setFieldErrors(fe);
					return;
				}
				const norm: LoginInput = parsed.data;
				const user = await login(norm.email, norm.password);
				onAuthed(user);
			}
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={`max-w-md mx-auto p-6 rounded-2xl ${swampPanel}`}>
			<h2 className="text-2xl font-extrabold text-emerald-100 mb-4 flex items-center gap-2">
				🐸 Frog Wizard Guild
			</h2>
			<form className="space-y-3" onSubmit={submit}>
				<div>
					<label className="block text-emerald-200 text-sm mb-1">Email</label>
					<input
						className="w-full px-3 py-2 rounded-lg bg-emerald-900/50 border border-emerald-700 text-emerald-100"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@swamp.com"
					/>
					{fieldErrors.email && (
						<div className="text-red-300 text-xs mt-1">{fieldErrors.email}</div>
					)}
				</div>
				{mode === "signup" && (
					<div>
						<label className="block text-emerald-200 text-sm mb-1">
							Username
						</label>
						<input
							className="w-full px-3 py-2 rounded-lg bg-emerald-900/50 border border-emerald-700 text-emerald-100"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="frog_wizard"
						/>
						{fieldErrors.username && (
							<div className="text-red-300 text-xs mt-1">
								{fieldErrors.username}
							</div>
						)}
					</div>
				)}
				<div>
					<label className="block text-emerald-200 text-sm mb-1">
						Password
					</label>
					<input
						type="password"
						className="w-full px-3 py-2 rounded-lg bg-emerald-900/50 border border-emerald-700 text-emerald-100"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••••"
					/>
					{fieldErrors.password && (
						<div className="text-red-300 text-xs mt-1">
							{fieldErrors.password}
						</div>
					)}
				</div>
				{error && <div className="text-red-300 text-sm">{error}</div>}
				<button
					type="submit"
					disabled={loading}
					className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-emerald-50 font-semibold"
				>
					{loading
						? "Working..."
						: mode === "signup"
							? "Create Guild Account"
							: "Enter the Swamp"}
				</button>
				<button
					type="button"
					onClick={() => setMode(mode === "signup" ? "login" : "signup")}
					className="w-full py-2 rounded-lg bg-emerald-900/40 border border-emerald-700 text-emerald-200"
				>
					{mode === "signup"
						? "Already have an account? Login"
						: "Need an account? Sign up"}
				</button>
			</form>
		</div>
	);
}
