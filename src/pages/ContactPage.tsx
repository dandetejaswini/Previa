import React, { useState } from "react";
import {
  Mail,
  Building,
  User,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Phone,
  MapPin,
  Database,
  FileSpreadsheet,
  Radar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { PREVIA_IMAGERY } from "../data/imagery";

export const ContactPage: React.FC = () => {
  const { currentUser, firebaseUser, isAuthenticated, openAuthModal } = useAuth();
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    company: currentUser?.company || "",
    message: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [firestoreSaved, setFirestoreSaved] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [sheetsRecorded, setSheetsRecorded] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync profile details if user signs in
  React.useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || currentUser.name,
        email: prev.email || currentUser.email,
        company: prev.company || currentUser.company || "",
      }));
    }
  }, [currentUser]);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.name.trim()) errs.name = "Full name is required";
    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Please enter a valid work email address";
    }
    if (!formData.company.trim()) errs.company = "Company name is required";
    if (!formData.message.trim()) {
      errs.message = "Message cannot be empty";
    } else if (formData.message.trim().length < 10) {
      errs.message = "Please provide at least 10 characters detailing your query";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const generatedTicket = "PRV-" + Math.floor(100000 + Math.random() * 900000);
    setTicketId(generatedTicket);

    let fsSuccess = false;
    let sheetsSuccess = false;

    // 1. Dual Write: Save to Cloud Firestore if user has Firebase credentials
    setFirestoreError(null);
    try {
      if (firebaseUser?.uid) {
        const subDocRef = doc(db, "contact_submissions", generatedTicket);
        console.log(`[Previa Contact] Writing contact submission to Firestore at: contact_submissions/${generatedTicket}`);
        await setDoc(subDocRef, {
          submissionId: generatedTicket,
          userId: firebaseUser.uid,
          fullName: formData.name.trim(),
          businessEmail: formData.email.trim(),
          organizationName: formData.company.trim(),
          operationalScenario: formData.message.trim(),
          createdAt: new Date().toISOString(),
          source: "contact_form",
        });
        fsSuccess = true;
        console.log(`[Previa Contact] Successfully wrote contact_submissions/${generatedTicket} in Firestore`);
      } else {
        console.log("[Previa Contact] Visitor submitted contact form as guest (unauthenticated). Routed to backend contact pipeline.");
      }
    } catch (fsErr: any) {
      console.error(`[Previa Contact] Firestore write failed for contact_submissions/${generatedTicket}:`, fsErr);
      const errInfo = handleFirestoreError(fsErr, OperationType.CREATE, `contact_submissions/${generatedTicket}`);
      setFirestoreError(errInfo.error || "Firestore write error occurred");
    }

    // 2. Dual Write: Dispatch to Previa server endpoint
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          company: formData.company.trim(),
          message: formData.message.trim(),
          submissionId: generatedTicket,
          userId: firebaseUser?.uid || currentUser?.id || "guest",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sheetsRecorded !== false) {
          sheetsSuccess = true;
        }
      }
    } catch (err) {
      console.warn("Server contact dispatch notice:", err);
    }

    setFirestoreSaved(fsSuccess);
    setSheetsRecorded(sheetsSuccess);

    // Backend must actually confirm submission before displaying success
    if (fsSuccess || sheetsSuccess) {
      setSubmitted(true);
      setSubmitError(null);
    } else {
      setSubmitError("We were unable to deliver your message at this time. Please check your network connection and try again.");
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      company: currentUser?.company || "",
      message: "",
    });
    setSubmitted(false);
    setFirestoreSaved(false);
    setFirestoreError(null);
    setSubmitError(null);
    setErrors({});
  };

  return (
    <div className="bg-parchment min-h-screen text-charcoal">
      {/* Header Banner */}
      <section className="pt-12 pb-14 bg-gradient-to-b from-parchment-light to-parchment border-b border-graphite">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white border border-graphite text-[#2F6F6D]">
            <Radar className="w-3.5 h-3.5 text-[#B86F52]" />
            <span>Enterprise Operations Advisory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-charcoal tracking-tight">
            Contact Previa
          </h1>
          <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto leading-relaxed">
            Connect with our supply-chain intelligence specialists for custom deployment, enterprise API integration, or multi-modal scenario modeling.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details & SLA (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-xl font-editorial font-bold text-charcoal mb-2">
                Supply Chain Advisory & Support
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                Whether you manage global maritime freight, multi-tier electronics manufacturing, or automotive assembly schedules, Previa's specialists are ready to discuss your resilience requirements.
              </p>
            </div>

            {/* Operational Advisory Photography Card */}
            <div className="rounded-2xl border border-graphite bg-white overflow-hidden shadow-2xs group">
              <div className="relative h-44 overflow-hidden">
                <img
                  src={PREVIA_IMAGERY.controlTowerMonitoring.src}
                  alt={PREVIA_IMAGERY.controlTowerMonitoring.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#211A27]/85 via-[#211A27]/30 to-transparent" />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-sm bg-[#B86F52] text-[10px] font-mono font-bold text-white uppercase">
                  {PREVIA_IMAGERY.controlTowerMonitoring.tag}
                </div>
                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                  <p className="text-xs font-semibold leading-snug drop-shadow-xs">
                    {PREVIA_IMAGERY.controlTowerMonitoring.caption}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-[#FAF8F4] border-t border-graphite flex items-center justify-between text-xs font-mono">
                <span className="text-charcoal-muted text-[11px]">Direct Advisory Desk</span>
                <span className="font-bold text-[#2F6F6D]">Chicago & Rotterdam</span>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-graphite bg-white shadow-2xs">
                <Clock className="w-5 h-5 text-[#B86F52] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-charcoal uppercase font-mono tracking-wider">
                    Response SLA
                  </h4>
                  <p className="text-xs text-charcoal-muted mt-0.5 leading-relaxed">
                    All inquiries are reviewed by our operations advisory team within 24 business hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-graphite bg-white shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-[#617A61] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-charcoal uppercase font-mono tracking-wider">
                    Confidentiality Commitment
                  </h4>
                  <p className="text-xs text-charcoal-muted mt-0.5 leading-relaxed">
                    All supplier and route parameters are treated under strict enterprise non-disclosure covenants.
                  </p>
                </div>
              </div>

              {/* Data Pipeline Guarantee Note */}
              <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-[#CDE2E1] bg-[#E8F2F1] text-xs">
                <FileSpreadsheet className="w-5 h-5 text-[#2F6F6D] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#1E4847] uppercase tracking-wider text-[11px] font-mono">
                    Direct Submission Pipeline
                  </h4>
                  <p className="text-[#2F6F6D] mt-0.5 leading-relaxed text-[11px]">
                    Inquiries are securely logged to our central operations ledger without requiring you to share any personal Google permissions or Drive access.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-graphite space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-3 text-charcoal">
                <MapPin className="w-4 h-4 text-[#B86F52] shrink-0" />
                <span>100 Logistics Blvd, Suite 400, Chicago, IL 60601</span>
              </div>
              <div className="flex items-center gap-3 text-charcoal">
                <Mail className="w-4 h-4 text-[#2F6F6D] shrink-0" />
                <span>contact@previa.ai</span>
              </div>
              <div className="flex items-center gap-3 text-charcoal">
                <Phone className="w-4 h-4 text-[#B86F52] shrink-0" />
                <span>+1 (800) 555-7738</span>
              </div>
            </div>
          </div>

          {/* Form / Success Card (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-graphite shadow-sm p-6 sm:p-8">
              {submitted ? (
                <div
                  id="contact-success-container"
                  className="text-center py-8 space-y-4 animate-in fade-in"
                >
                  <div className="w-14 h-14 rounded-full bg-[#EEF3EE] text-[#4A5F4A] border border-[#D3E0D3] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-editorial font-bold text-charcoal">
                    Thank you for contacting Previa. Your message has been received.
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
                    Our enterprise operations advisory team will review your inquiry and follow up within 24 business hours. Reference ticket: <span className="font-mono font-bold text-charcoal bg-stone-mist/60 px-2 py-0.5 rounded-sm">{ticketId}</span>.
                  </p>

                  <div className="p-4 bg-parchment-light border border-graphite rounded-xl text-xs text-charcoal-muted max-w-sm mx-auto text-left space-y-1.5 font-mono">
                    <div>
                      <span className="text-[#69656B]">Contact Name:</span>{" "}
                      <span className="text-charcoal font-semibold">{formData.name}</span>
                    </div>
                    <div>
                      <span className="text-[#69656B]">Business Email:</span>{" "}
                      <span className="text-charcoal font-semibold">{formData.email}</span>
                    </div>
                    {formData.company && (
                      <div>
                        <span className="text-[#69656B]">Company / Org:</span>{" "}
                        <span className="text-charcoal font-semibold">{formData.company}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      id="contact-send-another-btn"
                      onClick={resetForm}
                      className="px-5 py-2.5 bg-copper hover:bg-[#A25E43] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {submitError && (
                    <div className="p-3.5 bg-[#F8EBEA] border border-[#EFCBC9] rounded-xl flex items-start gap-2.5 text-xs text-[#8C3A35]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Submission Notice</span>
                        <span>{submitError}</span>
                      </div>
                    </div>
                  )}
                  {/* Contact Form Contextual Operations Image */}
                  <div className="relative h-36 sm:h-44 rounded-xl overflow-hidden mb-5 border border-graphite shadow-2xs group">
                    <img
                      src={PREVIA_IMAGERY.heroContainerPort.src}
                      alt={PREVIA_IMAGERY.heroContainerPort.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#211A27]/90 via-[#211A27]/40 to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#211A27]/85 text-[#FAF8F4] border border-white/20 backdrop-blur-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#617A61] animate-pulse" />
                        <span>Operations Advisory Desk</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-sm bg-[#B86F52] text-[10px] font-mono font-bold text-white uppercase">
                        Global Dispatch
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <p className="text-xs font-semibold drop-shadow-xs leading-snug">
                        Direct transmission to Previa supply-chain risk analysts and multi-tier network advisors
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-editorial font-bold text-charcoal mb-0.5">
                        Direct Communication Form
                      </h3>
                      <p className="text-xs text-charcoal-muted">
                        Fill out the fields below and an operations specialist will connect with you.
                      </p>
                    </div>

                    {!isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => openAuthModal("contact")}
                        className="text-xs font-semibold text-[#B86F52] hover:underline shrink-0 cursor-pointer"
                      >
                        Sign in for autofill
                      </button>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contact-name-input"
                      className="block text-xs font-mono font-semibold text-charcoal uppercase tracking-wider mb-1.5"
                    >
                      Your Name <span className="text-[#A94B45]">*</span>
                    </label>
                    <input
                      id="contact-name-input"
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      placeholder="e.g. Sarah Jenkins"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#B86F52]/20 focus:border-[#B86F52] text-charcoal ${
                        errors.name ? "border-[#A94B45] bg-[#F8EBEA]" : "border-graphite bg-white"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-[#A94B45] mt-1 flex items-center gap-1 font-mono">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-email-input"
                        className="block text-xs font-mono font-semibold text-charcoal uppercase tracking-wider mb-1.5"
                      >
                        Business Email <span className="text-[#A94B45]">*</span>
                      </label>
                      <input
                        id="contact-email-input"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: "" });
                        }}
                        placeholder="s.jenkins@enterprise.com"
                        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#B86F52]/20 focus:border-[#B86F52] text-charcoal ${
                          errors.email ? "border-[#A94B45] bg-[#F8EBEA]" : "border-graphite bg-white"
                        }`}
                      />
                      {errors.email && (
                        <p className="text-xs text-[#A94B45] mt-1 flex items-center gap-1 font-mono">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-company-input"
                        className="block text-xs font-mono font-semibold text-charcoal uppercase tracking-wider mb-1.5"
                      >
                        Company / Organization <span className="text-[#A94B45]">*</span>
                      </label>
                      <input
                        id="contact-company-input"
                        type="text"
                        value={formData.company}
                        onChange={(e) => {
                          setFormData({ ...formData, company: e.target.value });
                          if (errors.company) setErrors({ ...errors, company: "" });
                        }}
                        placeholder="Enter your company name"
                        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#B86F52]/20 focus:border-[#B86F52] text-charcoal ${
                          errors.company ? "border-[#A94B45] bg-[#F8EBEA]" : "border-graphite bg-white"
                        }`}
                      />
                      {errors.company && (
                        <p className="text-xs text-[#A94B45] mt-1 flex items-center gap-1 font-mono">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.company}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="contact-message-input"
                      className="block text-xs font-mono font-semibold text-charcoal uppercase tracking-wider mb-1.5"
                    >
                      Operational Scenario / Disruption Details <span className="text-[#A94B45]">*</span>
                    </label>
                    <textarea
                      id="contact-message-input"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (errors.message) setErrors({ ...errors, message: "" });
                      }}
                      placeholder="Describe your operational bottleneck, supplier dependencies, or volume scale..."
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#B86F52]/20 focus:border-[#B86F52] text-charcoal ${
                        errors.message ? "border-[#A94B45] bg-[#F8EBEA]" : "border-graphite bg-white"
                      }`}
                    />
                    {errors.message && (
                      <p className="text-xs text-[#A94B45] mt-1 flex items-center gap-1 font-mono">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    id="contact-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-copper hover:bg-[#A25E43] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#CD8569]/30"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Transmitting to Previa Network & Ledger...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-charcoal-muted text-center font-mono">
                    By submitting, you agree to Previa's data protection and mutual NDA guidelines.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
