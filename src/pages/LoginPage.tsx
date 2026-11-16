import React, { useState } from "react";
import { useAuth, getFriendlyAuthErrorMessage } from "../context/AuthContext";
import { PageView } from "../types";
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { PreviaBrand } from "../components/brand/PreviaBrand";

interface LoginPageProps {
  onNavigate: (page: PageView) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const {
    loginWithEmailPassword,
    loginWithGooglePopup,
    sendPasswordReset,
    isAuthenticated,
  } = useAuth();

  // Mode: standard login or password reset
  const [isResetMode, setIsResetMode] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Submission & Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  if (isAuthenticated) {
    onNavigate("intelligence");
    return null;
  }

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError("Email address is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError("Password is required.");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setIsSubmitting(true);
    try {
      await loginWithEmailPassword(email.trim(), password);
      onNavigate("intelligence");
    } catch (err: any) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err, "login");
      setServerError(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setResetSuccessMessage(null);

    const isEmailValid = validateEmail(email);
    if (!isEmailValid) return;

    setIsSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setResetSuccessMessage(
        "If an account exists for this email, we'll send instructions to reset your password."
      );
    } catch (err: any) {
      setServerError(getFriendlyAuthErrorMessage(err, "reset"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setServerError(null);
    setIsGoogleSigningIn(true);
    try {
      await loginWithGooglePopup();
      onNavigate("intelligence");
    } catch (err: any) {
      setServerError(getFriendlyAuthErrorMessage(err, "google"));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-parchment flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-graphite rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200">
        {/* Deep Aubergine Header */}
        <div className="bg-[#211A27] text-white px-6 sm:px-8 py-5 border-b border-[#3A3043]">
          <div className="mb-3">
            <PreviaBrand
              variant="dark"
              size="sm"
              subtitleText="Access Console"
            />
          </div>
          <h1 className="text-2xl font-editorial font-bold text-white tracking-tight">
            {isResetMode ? "Reset your password" : "Sign in to Previa"}
          </h1>
          <p className="text-xs text-[#D8D0C3]/80 mt-1">
            {isResetMode
              ? "Enter your verified operator email to receive a secure password recovery link."
              : "Verify your operator credentials to access supply-chain intelligence and simulations."}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="p-3.5 bg-[#F8EBEA] border border-[#EFCBC9] rounded-xl text-xs text-[#8C3A35] flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{serverError}</span>
              </div>
            </div>
          )}

          {/* Reset Success Message */}
          {resetSuccessMessage && (
            <div
              role="status"
              className="p-3.5 bg-[#EEF5EE] border border-[#C5DEC5] rounded-xl text-xs text-[#2A5C2A] flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{resetSuccessMessage}</span>
              </div>
            </div>
          )}

          {!isResetMode ? (
            <>
              {/* Google Sign-In Top CTA */}
              <div>
                <button
                  type="button"
                  id="login-google-btn"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleSigningIn || isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#D8D2C6] rounded-xl bg-white hover:bg-[#FAF8F4] text-[#29262A] font-semibold text-xs shadow-xs transition-all duration-150 hover:border-[#B86F52] focus:outline-hidden focus:ring-2 focus:ring-[#B86F52]/20 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {isGoogleSigningIn ? (
                    <div className="w-4 h-4 border-2 border-[#D8D2C6] border-t-[#B86F52] rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{isGoogleSigningIn ? "Connecting with Google..." : "Continue with Google"}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E7E1D7] w-full" />
                <span className="bg-white px-3 text-[11px] font-mono uppercase tracking-wider text-charcoal-muted shrink-0">
                  or sign in with email
                </span>
                <div className="border-t border-[#E7E1D7] w-full" />
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                {/* Email Address */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-[#29262A] mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    placeholder="operator@enterprise.com"
                    disabled={isSubmitting}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border text-charcoal placeholder-charcoal-muted focus:outline-hidden focus:ring-2 transition-all ${
                      emailError
                        ? "border-[#A94B45] focus:ring-[#A94B45]/20"
                        : "border-graphite focus:border-[#B86F52] focus:ring-[#B86F52]/20"
                    }`}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "login-email-error" : undefined}
                  />
                  {emailError && (
                    <p id="login-email-error" className="text-[11px] text-[#A94B45] mt-1 font-medium">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password & Forgot Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-[#29262A]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      id="login-forgot-password-link"
                      onClick={() => {
                        setIsResetMode(true);
                        setServerError(null);
                        setResetSuccessMessage(null);
                      }}
                      className="text-[11px] font-semibold text-[#B86F52] hover:text-[#A25E43] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="current-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) validatePassword(e.target.value);
                      }}
                      onBlur={() => validatePassword(password)}
                      placeholder="••••••••••••"
                      disabled={isSubmitting}
                      className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-white border text-charcoal placeholder-charcoal-muted focus:outline-hidden focus:ring-2 transition-all ${
                        passwordError
                          ? "border-[#A94B45] focus:ring-[#A94B45]/20"
                          : "border-graphite focus:border-[#B86F52] focus:ring-[#B86F52]/20"
                      }`}
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? "login-password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal p-1 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p id="login-password-error" className="text-[11px] text-[#A94B45] mt-1 font-medium">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Submit Primary CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="login-submit-btn"
                    disabled={isSubmitting || isGoogleSigningIn}
                    className="w-full py-3 px-4 bg-[#B86F52] hover:bg-[#A25E43] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border border-[#CD8569]/40"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Sign Up Link */}
              <div className="text-center pt-2 border-t border-[#E7E1D7]">
                <p className="text-xs text-charcoal-muted">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    id="login-goto-signup-btn"
                    onClick={() => onNavigate("signup")}
                    className="font-bold text-[#B86F52] hover:text-[#A25E43] hover:underline cursor-pointer ml-1"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </>
          ) : (
            /* Password Reset View */
            <form onSubmit={handleResetSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semibold text-[#29262A] mb-1"
                >
                  Account Email Address
                </label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  placeholder="operator@enterprise.com"
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border text-charcoal placeholder-charcoal-muted focus:outline-hidden focus:ring-2 transition-all ${
                    emailError
                      ? "border-[#A94B45] focus:ring-[#A94B45]/20"
                      : "border-graphite focus:border-[#B86F52] focus:ring-[#B86F52]/20"
                  }`}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "reset-email-error" : undefined}
                />
                {emailError && (
                  <p id="reset-email-error" className="text-[11px] text-[#A94B45] mt-1 font-medium">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  id="reset-submit-btn"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#B86F52] hover:bg-[#A25E43] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border border-[#CD8569]/40"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Email</span>
                  )}
                </button>

                <button
                  type="button"
                  id="reset-back-to-login-btn"
                  onClick={() => {
                    setIsResetMode(false);
                    setServerError(null);
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold text-charcoal-muted hover:text-charcoal transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* Security & Confidentiality */}
          <div className="pt-2 flex items-start gap-2 text-[10px] text-charcoal-muted leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#617A61] shrink-0 mt-0.5" />
            <span>
              Enterprise access protected by Supabase Authentication and Google SSO via Firebase. Operator identity verified with zero raw-password storage.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
