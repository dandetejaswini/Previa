import React, { useState } from "react";
import { useAuth, getFriendlyAuthErrorMessage } from "../context/AuthContext";
import { PageView } from "../types";
import { ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { PreviaBrand } from "../components/brand/PreviaBrand";

interface SignUpPageProps {
  onNavigate: (page: PageView) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate }) => {
  const { registerWithEmailPassword, loginWithGooglePopup, isAuthenticated } = useAuth();

  // Form states - initially all empty
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show / hide password states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field validation error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // Global submission state & error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isExistingEmail, setIsExistingEmail] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated) {
    onNavigate("intelligence");
    return null;
  }

  // Real-time / on-blur validation
  const validateName = (val: string): boolean => {
    if (!val.trim()) {
      setNameError("Full name is required.");
      return false;
    }
    setNameError(null);
    return true;
  };

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
    if (val.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const validateConfirmPassword = (val: string, pwdVal: string): boolean => {
    if (!val) {
      setConfirmPasswordError("Please confirm your password.");
      return false;
    }
    if (val !== pwdVal) {
      setConfirmPasswordError("Passwords do not match.");
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setVerificationMessage(null);
    setIsExistingEmail(false);

    const isNameValid = validateName(fullName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword, password);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerWithEmailPassword({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        company: company.trim() || undefined,
      });

      if (result.requiresEmailVerification) {
        setVerificationMessage(
          "Account created. Please check your email to verify your account."
        );
      } else {
        onNavigate("intelligence");
      }
    } catch (err: any) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err, "signup");
      setServerError(friendlyMsg);
      if (friendlyMsg.includes("already registered")) {
        setIsExistingEmail(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setServerError(null);
    setVerificationMessage(null);
    setIsExistingEmail(false);
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
            Create your Previa account
          </h1>
          <p className="text-xs text-[#D8D0C3]/80 mt-1">
            Enterprise supply chain risk prediction, cost modeling, and automated logistics containment.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Verification Notification */}
          {verificationMessage && (
            <div
              role="status"
              className="p-3.5 bg-[#EEF5EE] border border-[#C5DEC5] rounded-xl text-xs text-[#2A5C2A] flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{verificationMessage}</span>
              </div>
            </div>
          )}

          {/* Server-level Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="p-3.5 bg-[#F8EBEA] border border-[#EFCBC9] rounded-xl text-xs text-[#8C3A35] flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{serverError}</span>
                {isExistingEmail && (
                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={() => onNavigate("login")}
                      className="font-bold underline text-[#8C3A35] hover:text-[#5B2320] cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top CTA: Continue with Google */}
          <div>
            <button
              type="button"
              id="signup-google-btn"
              onClick={handleGoogleSignUp}
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
              or register with email
            </span>
            <div className="border-t border-[#E7E1D7] w-full" />
          </div>

          {/* Email / Password Registration Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-fullname"
                className="block text-xs font-semibold text-[#29262A] mb-1"
              >
                Full Name <span className="text-[#A94B45]">*</span>
              </label>
              <input
                id="signup-fullname"
                name="name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (nameError) validateName(e.target.value);
                }}
                onBlur={() => validateName(fullName)}
                placeholder="e.g. Elena Rostova"
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border text-charcoal placeholder-charcoal-muted focus:outline-hidden focus:ring-2 transition-all ${
                  nameError
                    ? "border-[#A94B45] focus:ring-[#A94B45]/20"
                    : "border-graphite focus:border-[#B86F52] focus:ring-[#B86F52]/20"
                }`}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? "signup-fullname-error" : undefined}
              />
              {nameError && (
                <p id="signup-fullname-error" className="text-[11px] text-[#A94B45] mt-1 font-medium">
                  {nameError}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-[#29262A] mb-1"
              >
                Email Address <span className="text-[#A94B45]">*</span>
              </label>
              <input
                id="signup-email"
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
                aria-describedby={emailError ? "signup-email-error" : undefined}
              />
              {emailError && (
                <p id="signup-email-error" className="text-[11px] text-[#A94B45] mt-1 font-medium">
                  {emailError}
                </p>
              )}
            </div>

            {/* Company / Organization (Optional) */}
            <div>
              <label
                htmlFor="signup-company"
                className="block text-xs font-semibold text-[#29262A] mb-1"
              >
                Company / Organization <span className="text-charcoal-muted text-[11px] font-normal">(Optional)</span>
              </label>
              <input
                id="signup-company"
                name="organization"
                type="text"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Apex Global Logistics"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-graphite text-charcoal placeholder-charcoal-muted focus:outline-hidden focus:border-[#B86F52] focus:ring-2 focus:ring-[#B86F52]/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-[#29262A] mb-1"
              >
                Password <span className="text-[#A94B45]">*</span>
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                    if (confirmPassword) validateConfirmPassword(confirmPassword, e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  placeholder="Minimum 8 characters"
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-white border text-charcoal placeholder-charcoal-muted focus:outline-hidden focus:ring-2 transition-all ${
                    passwordError
                      ? "border-[#A94B45] focus:ring-[#A94B45]/20"
                      : "border-graphite focus:border-[#B86F52] focus:ring-[#B86F52]/20"
                  }`}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "signup-password-error" : undefined}
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
                <p id="signup-password-error" className="text-[11px] text-[#A94B45] mt-1 font-medium">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-semibold text-[#29262A] mb-1"
              >
                Confirm Password <span className="text-[#A94B45]">*</span>
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) validateConfirmPassword(e.target.value, password);
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword, password)}
                  placeholder="Re-enter your password"
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-white border text-charcoal placeholder-charcoal-muted focus:outline-hidden focus:ring-2 transition-all ${
                    confirmPasswordError
                      ? "border-[#A94B45] focus:ring-[#A94B45]/20"
                      : "border-graphite focus:border-[#B86F52] focus:ring-[#B86F52]/20"
                  }`}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={confirmPasswordError ? "signup-confirm-password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal p-1 cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPasswordError && (
                <p id="signup-confirm-password-error" className="text-[11px] text-[#A94B45] mt-1 font-medium">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Submit Primary CTA */}
            <div className="pt-2">
              <button
                type="submit"
                id="signup-submit-btn"
                disabled={isSubmitting || isGoogleSigningIn}
                className="w-full py-3 px-4 bg-[#B86F52] hover:bg-[#A25E43] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border border-[#CD8569]/40"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          </form>

          {/* Existing Account Link */}
          <div className="text-center pt-2 border-t border-[#E7E1D7]">
            <p className="text-xs text-charcoal-muted">
              Already have an account?{" "}
              <button
                type="button"
                id="signup-goto-login-btn"
                onClick={() => onNavigate("login")}
                className="font-bold text-[#B86F52] hover:text-[#A25E43] hover:underline cursor-pointer ml-1"
              >
                Log in
              </button>
            </p>
          </div>

          {/* Security & Data Isolation Note */}
          <div className="pt-2 flex items-start gap-2 text-[10px] text-charcoal-muted leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#617A61] shrink-0 mt-0.5" />
            <span>
              End-to-end credential isolation via Supabase Authentication and Google SSO via Firebase. Previa never stores raw passwords or authentication secrets.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
