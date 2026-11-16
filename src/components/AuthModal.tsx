import React, { useState } from "react";
import { useAuth, getFriendlyAuthErrorMessage } from "../context/AuthContext";
import {
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { PreviaBrand } from "./brand/PreviaBrand";

export type AuthModalModeType = "signin" | "signup" | "forgot_password";

interface AuthModalProps {
  open?: boolean;
  mode?: AuthModalModeType;
  onClose?: () => void;
  onModeChange?: (mode: AuthModalModeType) => void;
  onSuccess?: () => void;
  onNavigate?: (page: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  mode,
  onClose,
  onModeChange,
  onSuccess,
}) => {
  const {
    authModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    loginWithGooglePopup,
    loginWithEmailPassword,
    registerWithEmailPassword,
    sendPasswordReset,
  } = useAuth();

  // Resolve controlled or context-derived visibility and mode
  const isOpen = open !== undefined ? open : authModalOpen;
  const rawMode = mode !== undefined ? mode : authMode;
  const currentMode: AuthModalModeType =
    rawMode === ("login" as any) ? "signin" : (rawMode as AuthModalModeType);

  // Form input fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show/Hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // Processing & feedback states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGoogleProcessing, setIsGoogleProcessing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isExistingEmail, setIsExistingEmail] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  // Close handler: sets authModalOpen to false with zero reload or navigation
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeAuthModal();
    }
  };

  // Tab switch handler: switches tab entirely through React state without closing/remounting
  const handleModeChange = (newMode: AuthModalModeType) => {
    setServerError(null);
    setResetSuccessMessage(null);
    setVerificationMessage(null);
    setIsExistingEmail(false);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setAuthMode(newMode);
    }
  };

  // If modal is not open, do not render
  if (!isOpen) return null;

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
    if (currentMode === "signup" && val.length < 8) {
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

  // Existing Firebase Google Sign-In remains completely unchanged
  const handleGoogleAuth = async () => {
    setIsGoogleProcessing(true);
    setServerError(null);
    setIsExistingEmail(false);
    try {
      await loginWithGooglePopup();
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      setServerError(getFriendlyAuthErrorMessage(err, "google"));
    } finally {
      setIsGoogleProcessing(false);
    }
  };

  // Supabase Email + Password Sign In
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsExistingEmail(false);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) return;

    setIsProcessing(true);
    try {
      await loginWithEmailPassword(email.trim(), password);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err, "login");
      setServerError(friendlyMsg);
      // Keep modal open and Sign In tab active
    } finally {
      setIsProcessing(false);
    }
  };

  // Supabase Email + Password Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setIsExistingEmail(false);
    setVerificationMessage(null);

    const isNameValid = validateName(fullName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword, password);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      return;
    }

    setIsProcessing(true);
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
        // Keep modal open and Create Account tab active as required
      } else {
        if (onSuccess) onSuccess();
        handleClose();
      }
    } catch (err: any) {
      const friendlyMsg = getFriendlyAuthErrorMessage(err, "signup");
      setServerError(friendlyMsg);
      if (
        friendlyMsg.toLowerCase().includes("already registered") ||
        friendlyMsg.toLowerCase().includes("already in use")
      ) {
        setIsExistingEmail(true);
      }
      // Keep modal open and Create Account tab active
    } finally {
      setIsProcessing(false);
    }
  };

  // Supabase Password Reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setResetSuccessMessage(null);

    const isEmailValid = validateEmail(email);
    if (!isEmailValid) return;

    setIsProcessing(true);
    try {
      await sendPasswordReset(email.trim());
      setResetSuccessMessage(
        "If an account exists for this email, we'll send instructions to reset your password."
      );
    } catch (err: any) {
      setServerError(getFriendlyAuthErrorMessage(err, "reset"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="previa-auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#34413B]/40 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="previa-auth-modal"
        className="relative w-full max-w-md my-8 bg-[#FCFCF9] rounded-2xl shadow-lg border border-[#DDE2DC] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE2DC] bg-[#EEF1EA] text-[#34413B]">
          <PreviaBrand
            variant="light"
            size="sm"
            subtitleText="Operator Verification"
          />
          <button
            type="button"
            id="auth-modal-close-btn"
            onClick={handleClose}
            className="p-1 rounded-md text-[#66736C] hover:text-[#34413B] hover:bg-[#DDE8E1] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Stable React state switching without reloads or navigation */}
        {currentMode !== "forgot_password" && (
          <div className="flex border-b border-[#DDE2DC] bg-[#EEF1EA]">
            <button
              type="button"
              id="modal-tab-signin"
              onClick={() => handleModeChange("signin")}
              className={`flex-1 py-3 text-xs font-semibold text-center transition-colors cursor-pointer ${
                currentMode === "signin"
                  ? "bg-[#FCFCF9] text-[#466B5C] border-b-2 border-[#557A6B] font-bold"
                  : "text-[#66736C] hover:text-[#34413B] hover:bg-[#EEF1EA]/80"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="modal-tab-signup"
              onClick={() => handleModeChange("signup")}
              className={`flex-1 py-3 text-xs font-semibold text-center transition-colors cursor-pointer ${
                currentMode === "signup"
                  ? "bg-[#FCFCF9] text-[#466B5C] border-b-2 border-[#557A6B] font-bold"
                  : "text-[#66736C] hover:text-[#34413B] hover:bg-[#EEF1EA]/80"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Modal Form Content */}
        <div className="p-6 sm:p-7 max-h-[calc(85vh-80px)] overflow-y-auto">
          {/* Header context */}
          <div className="text-center mb-5">
            <h2 className="text-xl font-editorial font-bold text-[#34413B] tracking-tight">
              {currentMode === "signup"
                ? "Create your Previa account"
                : currentMode === "forgot_password"
                ? "Reset your password"
                : "Sign in to Previa Intelligence"}
            </h2>
            <p className="text-xs text-[#66736C] mt-1.5 leading-relaxed">
              {currentMode === "signup"
                ? "Register with email or Google to predict supply-chain disruptions and execute automated mitigations."
                : currentMode === "forgot_password"
                ? "Enter your verified operator email to receive a secure password recovery link."
                : "Predict disruptions, estimate exposure, and execute mitigations across global freight corridors."}
            </p>
          </div>

          {/* Feedback & Error Alerts */}
          {serverError && (
            <div
              role="alert"
              className="mb-4 p-3 bg-[#F9ECEB] border border-[#B76D68]/30 rounded-xl text-xs text-[#B76D68] flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{serverError}</span>
                {isExistingEmail && (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => handleModeChange("signin")}
                      className="font-bold underline text-[#B76D68] hover:text-[#914F4B] cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {verificationMessage && (
            <div
              role="status"
              className="mb-4 p-3.5 bg-[#EEF3EE] border border-[#66836F]/30 rounded-xl text-xs text-[#66836F] flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold">{verificationMessage}</span>
              </div>
            </div>
          )}

          {resetSuccessMessage && (
            <div
              role="status"
              className="mb-4 p-3 bg-[#EEF3EE] border border-[#66836F]/30 rounded-xl text-xs text-[#66836F] flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{resetSuccessMessage}</span>
              </div>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {currentMode === "signin" && (
            <div className="space-y-4">
              {/* Google Sign-in Primary Button */}
              <button
                id="modal-google-auth-btn"
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleProcessing || isProcessing}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#D5DDD7] rounded-xl bg-[#FCFCF9] hover:bg-[#EEF1EA] text-[#34413B] font-semibold text-xs shadow-xs transition-all duration-150 hover:border-[#557A6B] focus:outline-hidden focus:ring-2 focus:ring-[#557A6B]/20 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isGoogleProcessing ? (
                  <div className="w-4 h-4 border-2 border-[#DDE2DC] border-t-[#557A6B] rounded-full animate-spin" />
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
                <span>
                  {isGoogleProcessing ? "Connecting to Google..." : "Continue with Google"}
                </span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#DDE2DC] w-full" />
                <span className="bg-[#FCFCF9] px-3 text-[10px] font-mono uppercase tracking-wider text-[#66736C] shrink-0">
                  or sign in with email
                </span>
                <div className="border-t border-[#DDE2DC] w-full" />
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-3.5">
                <div>
                  <label
                    htmlFor="modal-login-email"
                    className="block text-xs font-semibold text-[#34413B] mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="modal-login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    placeholder="operator@enterprise.com"
                    disabled={isProcessing}
                    className={`w-full px-3 py-2 text-xs rounded-xl bg-[#FAFBF8] border text-[#34413B] placeholder-[#8B958F] focus:outline-hidden focus:ring-2 transition-all ${
                      emailError
                        ? "border-[#B76D68] focus:ring-[#B76D68]/20"
                        : "border-[#DDE2DC] focus:border-[#557A6B] focus:ring-[#557A6B]/20"
                    }`}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "modal-login-email-error" : undefined}
                  />
                  {emailError && (
                    <p id="modal-login-email-error" className="text-[11px] text-[#B76D68] mt-1 font-medium">
                      {emailError}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="modal-login-password"
                      className="block text-xs font-semibold text-[#34413B]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => handleModeChange("forgot_password")}
                      className="text-[11px] font-semibold text-[#557A6B] hover:text-[#466B5C] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="modal-login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) validatePassword(e.target.value);
                      }}
                      onBlur={() => validatePassword(password)}
                      placeholder="••••••••••••"
                      disabled={isProcessing}
                      className={`w-full px-3 py-2 pr-10 text-xs rounded-xl bg-[#FAFBF8] border text-[#34413B] placeholder-[#8B958F] focus:outline-hidden focus:ring-2 transition-all ${
                        passwordError
                          ? "border-[#B76D68] focus:ring-[#B76D68]/20"
                          : "border-[#DDE2DC] focus:border-[#557A6B] focus:ring-[#557A6B]/20"
                      }`}
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? "modal-login-password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B958F] hover:text-[#34413B] p-1 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p id="modal-login-password-error" className="text-[11px] text-[#B76D68] mt-1 font-medium">
                      {passwordError}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="modal-login-submit-btn"
                    disabled={isProcessing || isGoogleProcessing}
                    className="w-full py-2.5 px-4 bg-[#557A6B] hover:bg-[#466B5C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </div>

                {/* Switch to Sign Up */}
                <div className="text-center pt-2 border-t border-[#DDE2DC]">
                  <p className="text-xs text-[#66736C]">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => handleModeChange("signup")}
                      className="font-bold text-[#557A6B] hover:text-[#466B5C] hover:underline cursor-pointer ml-1"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CREATE ACCOUNT FORM */}
          {currentMode === "signup" && (
            <div className="space-y-4">
              {/* Google Sign-in Primary Button */}
              <button
                id="modal-google-auth-btn-signup"
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleProcessing || isProcessing}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#D5DDD7] rounded-xl bg-[#FCFCF9] hover:bg-[#EEF1EA] text-[#34413B] font-semibold text-xs shadow-xs transition-all duration-150 hover:border-[#557A6B] focus:outline-hidden focus:ring-2 focus:ring-[#557A6B]/20 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isGoogleProcessing ? (
                  <div className="w-4 h-4 border-2 border-[#DDE2DC] border-t-[#557A6B] rounded-full animate-spin" />
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
                <span>
                  {isGoogleProcessing ? "Connecting to Google..." : "Continue with Google"}
                </span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#DDE2DC] w-full" />
                <span className="bg-[#FCFCF9] px-3 text-[10px] font-mono uppercase tracking-wider text-[#66736C] shrink-0">
                  or register with email
                </span>
                <div className="border-t border-[#DDE2DC] w-full" />
              </div>

              {/* Sign Up Form */}
              <form onSubmit={handleSignUpSubmit} noValidate className="space-y-3">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="modal-signup-name"
                    className="block text-xs font-semibold text-[#34413B] mb-1"
                  >
                    Name <span className="text-[#B76D68]">*</span>
                  </label>
                  <input
                    id="modal-signup-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (nameError) validateName(e.target.value);
                    }}
                    onBlur={() => validateName(fullName)}
                    placeholder="e.g. Elena Rostova"
                    disabled={isProcessing}
                    className={`w-full px-3 py-2 text-xs rounded-xl bg-[#FAFBF8] border text-[#34413B] placeholder-[#8B958F] focus:outline-hidden focus:ring-2 transition-all ${
                      nameError
                        ? "border-[#B76D68] focus:ring-[#B76D68]/20"
                        : "border-[#DDE2DC] focus:border-[#557A6B] focus:ring-[#557A6B]/20"
                    }`}
                    aria-invalid={!!nameError}
                    aria-describedby={nameError ? "modal-signup-name-error" : undefined}
                  />
                  {nameError && (
                    <p id="modal-signup-name-error" className="text-[11px] text-[#B76D68] mt-1 font-medium">
                      {nameError}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="modal-signup-email"
                    className="block text-xs font-semibold text-[#34413B] mb-1"
                  >
                    Email Address <span className="text-[#B76D68]">*</span>
                  </label>
                  <input
                    id="modal-signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    placeholder="operator@enterprise.com"
                    disabled={isProcessing}
                    className={`w-full px-3 py-2 text-xs rounded-xl bg-[#FAFBF8] border text-[#34413B] placeholder-[#8B958F] focus:outline-hidden focus:ring-2 transition-all ${
                      emailError
                        ? "border-[#B76D68] focus:ring-[#B76D68]/20"
                        : "border-[#DDE2DC] focus:border-[#557A6B] focus:ring-[#557A6B]/20"
                    }`}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "modal-signup-email-error" : undefined}
                  />
                  {emailError && (
                    <p id="modal-signup-email-error" className="text-[11px] text-[#B76D68] mt-1 font-medium">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="modal-signup-password"
                    className="block text-xs font-semibold text-[#34413B] mb-1"
                  >
                    Password <span className="text-[#B76D68]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="modal-signup-password"
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
                      disabled={isProcessing}
                      className={`w-full px-3 py-2 pr-10 text-xs rounded-xl bg-[#FAFBF8] border text-[#34413B] placeholder-[#8B958F] focus:outline-hidden focus:ring-2 transition-all ${
                        passwordError
                          ? "border-[#B76D68] focus:ring-[#B76D68]/20"
                          : "border-[#DDE2DC] focus:border-[#557A6B] focus:ring-[#557A6B]/20"
                      }`}
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? "modal-signup-password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B958F] hover:text-[#34413B] p-1 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p id="modal-signup-password-error" className="text-[11px] text-[#B76D68] mt-1 font-medium">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="modal-signup-confirm"
                    className="block text-xs font-semibold text-[#34413B] mb-1"
                  >
                    Confirm Password <span className="text-[#B76D68]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="modal-signup-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError) validateConfirmPassword(e.target.value, password);
                      }}
                      onBlur={() => validateConfirmPassword(confirmPassword, password)}
                      placeholder="Re-enter your password"
                      disabled={isProcessing}
                      className={`w-full px-3 py-2 pr-10 text-xs rounded-xl bg-[#FAFBF8] border text-[#34413B] placeholder-[#8B958F] focus:outline-hidden focus:ring-2 transition-all ${
                        confirmPasswordError
                          ? "border-[#B76D68] focus:ring-[#B76D68]/20"
                          : "border-[#DDE2DC] focus:border-[#557A6B] focus:ring-[#557A6B]/20"
                      }`}
                      aria-invalid={!!confirmPasswordError}
                      aria-describedby={confirmPasswordError ? "modal-signup-confirm-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B958F] hover:text-[#34413B] p-1 cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p id="modal-signup-confirm-error" className="text-[11px] text-[#B76D68] mt-1 font-medium">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>

                {/* Company / Organization (Optional) */}
                <div>
                  <label
                    htmlFor="modal-signup-company"
                    className="block text-xs font-semibold text-[#34413B] mb-1"
                  >
                    Company / Organization{" "}
                    <span className="text-[#8B958F] text-[11px] font-normal">(Optional)</span>
                  </label>
                  <input
                    id="modal-signup-company"
                    type="text"
                    autoComplete="organization"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Apex Global Logistics"
                    disabled={isProcessing}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAFBF8] border border-[#DDE2DC] text-[#34413B] placeholder-[#8B958F] focus:outline-hidden focus:border-[#557A6B] focus:ring-2 focus:ring-[#557A6B]/20 transition-all"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="modal-signup-submit-btn"
                    disabled={isProcessing || isGoogleProcessing}
                    className="w-full py-2.5 px-4 bg-[#557A6B] hover:bg-[#466B5C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </div>

                {/* Switch to Sign In */}
                <div className="text-center pt-2 border-t border-[#DDE2DC]">
                  <p className="text-xs text-[#66736C]">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => handleModeChange("signin")}
                      className="font-bold text-[#557A6B] hover:text-[#466B5C] hover:underline cursor-pointer ml-1"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {currentMode === "forgot_password" && (
            <form onSubmit={handleResetSubmit} noValidate className="space-y-3.5">
              <div>
                <label
                  htmlFor="modal-reset-email"
                  className="block text-xs font-semibold text-[#34413B] mb-1"
                >
                  Account Email Address
                </label>
                <input
                  id="modal-reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  placeholder="operator@enterprise.com"
                  disabled={isProcessing}
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-[#FAFBF8] border text-[#34413B] placeholder-[#8B958F] focus:outline-hidden focus:ring-2 transition-all ${
                    emailError
                      ? "border-[#B76D68] focus:ring-[#B76D68]/20"
                      : "border-[#DDE2DC] focus:border-[#557A6B] focus:ring-[#557A6B]/20"
                  }`}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "modal-reset-email-error" : undefined}
                />
                {emailError && (
                  <p id="modal-reset-email-error" className="text-[11px] text-[#B76D68] mt-1 font-medium">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  id="modal-reset-submit-btn"
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 bg-[#557A6B] hover:bg-[#466B5C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Email</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("signin")}
                  className="w-full py-2 px-3 text-xs font-semibold text-[#66736C] hover:text-[#34413B] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* Security note */}
          <div className="mt-5 pt-3 border-t border-[#DDE2DC] flex items-start gap-2 text-[10px] text-[#8B958F]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#66836F] shrink-0 mt-0.5" />
            <span>
              SSO via Firebase & Secure Authentication via Supabase. All sessions are cryptographically verified.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
