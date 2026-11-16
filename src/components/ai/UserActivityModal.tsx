import React, { useState, useEffect } from "react";
import {
  History,
  X,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Eye,
  Building2,
  FileCheck,
  XCircle,
  ListTodo,
} from "lucide-react";
import { UserActivityQueryResponse, UserActivityRecord } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { PreviaBrand } from "../brand/PreviaBrand";
import { authFetch } from "../../lib/apiClient";

interface UserActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserActivityModal: React.FC<UserActivityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<UserActivityQueryResponse | null>(null);
  const [rawActivities, setRawActivities] = useState<UserActivityRecord[]>([]);

  const handleQuery = async (customQ?: string) => {
    const q = (customQ || query).trim();
    if (!q) return;

    setLoading(true);
    try {
      const res = await authFetch(
        "/api/agents/user-activity",
        {
          method: "POST",
          body: JSON.stringify({
            query: q,
            userId: currentUser?.id,
            userEmail: currentUser?.email,
          }),
        },
        currentUser
      );
      const data = await res.json();
      if (data.success && data.execution?.result) {
        setResponse(data.execution.result as UserActivityQueryResponse);
        if (Array.isArray(data.execution.result.activitiesFound)) {
          setRawActivities(data.execution.result.activitiesFound);
        }
        setQuery("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleQuery("What did I analyze today?");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate 8 explicit metrics required by Section 13 from actual user activities
  const userActivities = rawActivities;
  const analysesRun = userActivities.filter((a) => a.actionType === "analysis_run").length;
  const risksReviewed = userActivities.filter((a) => a.actionType === "risk_reviewed").length;
  const shipmentsViewed = userActivities.filter((a) => a.actionType === "shipment_viewed").length;
  const suppliersViewed = userActivities.filter(
    (a) => a.actionType === "supplier_viewed" || (a.entityName && a.entityName.includes("Supplier"))
  ).length;
  const recommendationsApproved = userActivities.filter(
    (a) => a.actionType === "recommendation_approved"
  ).length;
  const recommendationsRejected = userActivities.filter(
    (a) => a.actionType === "recommendation_rejected"
  ).length;
  const playbookTasksCompleted = userActivities.filter(
    (a) => a.actionType === "playbook_task_completed"
  ).length;
  const pendingActions = userActivities.filter(
    (a) => a.actionType === "analysis_run" || a.actionType === "risk_reviewed"
  ).length;

  const quickPrompts = [
    "What did I analyze today?",
    "Which risks did I review?",
    "What recommendations did I approve?",
    "What actions are pending?",
    "Which suppliers did I investigate?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
      <div className="bg-white border border-graphite rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-graphite pb-3 shrink-0">
          <PreviaBrand
            variant="light"
            size="sm"
            subtitleText="User Activity Agent"
          />

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-charcoal-muted hover:text-charcoal rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 8 Explicit User Activity Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 font-mono text-xs">
          <div className="p-3 bg-stone-mist/30 border border-graphite/60 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase text-charcoal-muted block">Analyses Run</span>
            <strong className="text-base text-charcoal">{analysesRun}</strong>
          </div>
          <div className="p-3 bg-stone-mist/30 border border-graphite/60 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase text-charcoal-muted block">Risks Reviewed</span>
            <strong className="text-base text-charcoal">{risksReviewed}</strong>
          </div>
          <div className="p-3 bg-stone-mist/30 border border-graphite/60 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase text-charcoal-muted block">Shipments Viewed</span>
            <strong className="text-base text-charcoal">{shipmentsViewed}</strong>
          </div>
          <div className="p-3 bg-stone-mist/30 border border-graphite/60 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase text-charcoal-muted block">Suppliers Viewed</span>
            <strong className="text-base text-charcoal">{suppliersViewed}</strong>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase text-emerald-800 block">Recs Approved</span>
            <strong className="text-base text-emerald-700">{recommendationsApproved}</strong>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase text-rose-800 block">Recs Rejected</span>
            <strong className="text-base text-rose-700">{recommendationsRejected}</strong>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase text-blue-800 block">Tasks Completed</span>
            <strong className="text-base text-blue-700">{playbookTasksCompleted}</strong>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-0.5">
            <span className="text-[10px] uppercase text-amber-800 block">Pending Actions</span>
            <strong className="text-base text-amber-700">{pendingActions}</strong>
          </div>
        </div>

        {/* Quick Natural Question Chips */}
        <div className="space-y-1.5 shrink-0">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal-muted block">
            Natural Questions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuery(qp)}
                className="text-[11px] font-mono px-2.5 py-1 bg-white hover:bg-stone-mist border border-graphite rounded-lg text-charcoal transition-colors cursor-pointer shadow-2xs"
              >
                &ldquo;{qp}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Content Body / Response */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <Clock className="w-6 h-6 animate-spin text-[#B86F52] mx-auto" />
              <p className="text-xs text-charcoal-muted font-mono">
                Checking your verified activity ledger...
              </p>
            </div>
          ) : response ? (
            <div className="p-4 bg-[#FAF8F4] border border-graphite rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-graphite/40 pb-2">
                <span className="font-bold text-[#246B68] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B96F4A]" />
                  <span>User Activity Agent Summary</span>
                </span>
                <span className="text-[10px] text-charcoal-muted">Verified audit</span>
              </div>

              <div className="text-charcoal leading-relaxed whitespace-pre-wrap font-sans text-xs">
                {response.answer}
              </div>

              {response.activitiesFound && response.activitiesFound.length > 0 && (
                <div className="pt-2 border-t border-graphite/40 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-charcoal-muted block">
                    Recent Verified Activity Records:
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {response.activitiesFound.map((act) => (
                      <div
                        key={act.id}
                        className="p-2 bg-white rounded-lg border border-graphite/60 flex items-center justify-between text-[11px]"
                      >
                        <span className="text-charcoal truncate">{act.summary}</span>
                        <span className="text-[9px] text-charcoal-muted shrink-0 ml-2">
                          {new Date(act.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-charcoal-muted font-mono">
              Ask a question above or select a preset prompt to inspect your activity history.
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery();
          }}
          className="flex items-center gap-2 pt-2 border-t border-graphite shrink-0"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your reviews, actions, or analyzed suppliers..."
            className="flex-1 px-4 py-2 bg-stone-mist/30 border border-graphite rounded-xl text-xs font-mono text-charcoal placeholder:text-charcoal-muted/60 focus:outline-hidden focus:border-[#B86F52]"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-2.5 bg-[#211A27] hover:bg-[#3A3043] disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-[#B86F52]" />
          </button>
        </form>
      </div>
    </div>
  );
};
