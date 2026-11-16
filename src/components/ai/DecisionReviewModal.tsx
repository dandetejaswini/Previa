import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Edit3,
  Clock,
  DollarSign,
  AlertTriangle,
  X,
  FileCheck,
  Send,
  UserCheck,
  Lock,
} from "lucide-react";
import { PreviaDecisionEvent, PreviaDecisionRecommendation } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { authFetch } from "../../lib/apiClient";

interface DecisionReviewModalProps {
  decision: PreviaDecisionEvent | null;
  onClose: () => void;
  onDecisionUpdated: (updated: PreviaDecisionEvent) => void;
}

export const DecisionReviewModal: React.FC<DecisionReviewModalProps> = ({
  decision,
  onClose,
  onDecisionUpdated,
}) => {
  const { currentUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modifyNotes, setModifyNotes] = useState("");
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);

  if (!decision) return null;

  const isApproved = decision.humanDecision === "approved";
  const isRejected = decision.humanDecision === "rejected";
  const isCompleted = decision.actionStatus === "completed";
  const isTerminal = isApproved || isRejected || isCompleted;

  const handleAction = async (action: "approve" | "reject" | "modify") => {
    if (isTerminal) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await authFetch(
        "/api/orchestrator/decision-action",
        {
          method: "POST",
          body: JSON.stringify({
            decisionId: decision.eventId,
            action,
            operatorData: {
              userId: currentUser?.id,
              userEmail: currentUser?.email,
              modifiedRecommendation: modifyNotes.trim() || undefined,
              recommendationId: selectedRecId || undefined,
            },
          }),
        },
        currentUser
      );

      const data = await res.json();
      if (res.ok && data.success && data.decision) {
        onDecisionUpdated(data.decision);
        onClose();
      } else {
        setErrorMessage(data.error || "Failed to submit decision action.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const approvedRec = decision.recommendations.find((r) => r.approvedAt || r.approvedBy);
  const actedAt = approvedRec?.approvedAt || decision.timestamp;
  const actedBy = approvedRec?.approvedBy || "Authorized Operator";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
      <div className="bg-white border border-graphite rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-graphite pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-editorial font-bold text-charcoal">
                {isTerminal ? "Decision Event Record (Read-Only)" : "Human-in-the-Loop Decision Review"}
              </h3>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800"
                    : isRejected
                    ? "bg-rose-100 text-rose-800"
                    : isCompleted
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {decision.humanDecision ? decision.humanDecision.toUpperCase() : "PENDING REVIEW"}
              </span>
            </div>
            <p className="text-xs text-charcoal-muted font-mono">
              Decision ID: {decision.eventId} • Run: {decision.runId} • Engine: {decision.sourceEngine}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-charcoal-muted hover:text-charcoal rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Terminal State Audit Header Banner */}
        {isTerminal && (
          <div className="p-3.5 bg-stone-mist/30 border border-graphite/70 rounded-xl text-xs font-mono space-y-1">
            <div className="flex items-center gap-2 font-bold text-charcoal">
              {isApproved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              ) : isRejected ? (
                <XCircle className="w-4 h-4 text-rose-700" />
              ) : (
                <FileCheck className="w-4 h-4 text-blue-700" />
              )}
              <span>Terminal Decision: {decision.humanDecision?.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-charcoal-muted">
              <div>
                <span className="font-semibold text-charcoal">Acted At: </span>
                <span>{new Date(actedAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-semibold text-charcoal">Operator: </span>
                <span>{actedBy}</span>
              </div>
            </div>
            {decision.modifiedRecommendation && (
              <div className="pt-1.5 border-t border-graphite/40 text-[11px]">
                <strong className="text-charcoal block">Operator Modification Directive:</strong>
                <p className="text-charcoal-muted font-sans mt-0.5">{decision.modifiedRecommendation}</p>
              </div>
            )}
          </div>
        )}

        {/* Executive Impact Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-stone-mist/20 border border-graphite/60 rounded-xl space-y-1">
            <span className="text-[10px] text-charcoal-muted uppercase block">Financial Exposure</span>
            <span className="font-bold text-charcoal block">
              {decision.financialImpact.displayValue}
            </span>
          </div>
          <div className="p-3 bg-stone-mist/20 border border-graphite/60 rounded-xl space-y-1">
            <span className="text-[10px] text-charcoal-muted uppercase block">Schedule Drift</span>
            <span className="font-bold text-charcoal block">
              {decision.scheduleImpact.displayValue}
            </span>
          </div>
          <div className="p-3 bg-stone-mist/20 border border-graphite/60 rounded-xl space-y-1">
            <span className="text-[10px] text-charcoal-muted uppercase block">Safety Stock Horizon</span>
            <span className="font-bold text-charcoal block">
              {decision.starvationHorizon.displayValue}
            </span>
          </div>
        </div>

        {/* AI Recommendations List */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-charcoal uppercase tracking-wider block">
            Original AI Recommendation ({decision.recommendations.length})
          </span>

          <div className="space-y-2">
            {decision.recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => !isTerminal && setSelectedRecId(rec.id)}
                className={`p-3.5 border rounded-xl space-y-1.5 text-xs transition-colors ${
                  !isTerminal ? "cursor-pointer" : ""
                } ${
                  selectedRecId === rec.id
                    ? "bg-[#FAF7F2] border-[#B86F52]"
                    : "bg-stone-mist/20 border-graphite/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-charcoal">{rec.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-stone-mist text-charcoal uppercase font-bold">
                    {rec.priority} • {rec.timeframe}
                  </span>
                </div>
                <p className="text-charcoal-muted leading-relaxed font-mono">{rec.action}</p>
                <div className="text-[10px] font-mono text-charcoal-muted flex items-center justify-between pt-1 border-t border-graphite/40">
                  <span>Owner: {rec.owner}</span>
                  <span>State: {rec.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-mono flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Operator Note / Modification Box (Only for Pending Decisions) */}
        {!isTerminal && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-charcoal">
              Operator Modification or Audit Directives (Optional)
            </label>
            <textarea
              rows={2}
              value={modifyNotes}
              onChange={(e) => setModifyNotes(e.target.value)}
              placeholder="Specify adjustments to lead times, secondary allocation caps, or operational notes before executing..."
              className="w-full p-2.5 text-xs bg-stone-mist/20 border border-graphite rounded-xl focus:outline-hidden focus:border-[#B86F52] text-charcoal font-mono"
            />
          </div>
        )}

        {/* Actions Row */}
        <div className="pt-3 border-t border-graphite flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <span className="text-charcoal-muted text-[11px]">
            {isTerminal ? `Verified Decision Record` : `Operator: ${currentUser?.email || "Authorized CSCO"}`}
          </span>

          <div className="flex items-center gap-2">
            {isTerminal ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#211A27] hover:bg-[#3A3043] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close View
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction("reject")}
                  className="px-3.5 py-2 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                {modifyNotes.trim() && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleAction("modify")}
                    className="px-3.5 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Approve with Modification</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction("approve")}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Action Plan</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
