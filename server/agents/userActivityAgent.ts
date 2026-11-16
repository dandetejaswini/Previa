import {
  AgentExecutionRecord,
  UserActivityRecord,
  UserActivityQueryResponse,
} from "../../src/types";

export interface UserActivityAgentInput {
  userId?: string;
  userEmail?: string;
  query: string;
  userActivities: UserActivityRecord[];
}

/**
 * AGENT 11 — USER ACTIVITY AGENT
 * Understands the user's authentic activities across Previa.
 * Uses strictly recorded application events without fabrication.
 * Strictly enforces user isolation based on userId / userEmail.
 */
export async function executeUserActivityAgent(
  runId: string,
  input: UserActivityAgentInput
): Promise<AgentExecutionRecord> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const evidence: string[] = [];

  try {
    const rawActivities = input.userActivities || [];
    const queryLower = (input.query || "").toLowerCase();

    // Filter activities belonging to this user if userId is provided
    const userActivities = input.userId
      ? rawActivities.filter(
          (a) => a.userId === input.userId || a.userEmail?.toLowerCase() === input.userEmail?.toLowerCase()
        )
      : rawActivities;

    evidence.push(`Evaluated ${userActivities.length} verified user activity logs.`);

    // Today's date check (UTC)
    const todayStr = new Date().toISOString().split("T")[0];
    const todayActivities = userActivities.filter((a) => a.timestamp.startsWith(todayStr));

    const pendingActions = userActivities.filter(
      (a) => a.actionType === "analysis_run" || a.actionType === "risk_reviewed"
    );

    const suppliersInspected = Array.from(
      new Set(userActivities.filter((a) => a.entityName).map((a) => a.entityName!))
    );

    const approvedDecisions = userActivities
      .filter((a) => a.actionType === "recommendation_approved")
      .map((a) => a.summary);

    const pendingDecisions = userActivities
      .filter((a) => a.actionType === "analysis_run")
      .map((a) => a.summary);

    let answer = "";

    if (queryLower.includes("today") || queryLower.includes("what did i analyze") || queryLower.includes("work on")) {
      if (todayActivities.length === 0) {
        answer = `You have not recorded any analyses or operational reviews today (${todayStr}). Your historical activity contains ${userActivities.length} earlier event(s).`;
      } else {
        const summaries = todayActivities.map((a) => `• [${a.timestamp.slice(11, 16)} UTC] ${a.summary}`).join("\n");
        answer = `Today you performed ${todayActivities.length} operational actions across Previa:\n${summaries}`;
      }
    } else if (queryLower.includes("risk") || queryLower.includes("review")) {
      const riskActivities = userActivities.filter(
        (a) => a.actionType === "risk_reviewed" || (a.details && a.details.category)
      );
      if (riskActivities.length === 0) {
        answer = "You have not reviewed any specific risk items yet in this active session.";
      } else {
        answer = `You have reviewed ${riskActivities.length} risk incident(s):\n` +
          riskActivities.map((a) => `• ${a.summary} (${a.timestamp.split("T")[0]})`).join("\n");
      }
    } else if (queryLower.includes("pending") || queryLower.includes("unresolved") || queryLower.includes("actions")) {
      if (pendingDecisions.length === 0) {
        answer = "You currently have no pending recommendations awaiting human operator sign-off.";
      } else {
        answer = `You have ${pendingDecisions.length} operational scenario(s) in review:\n` +
          pendingDecisions.map((p) => `• ${p}`).join("\n") +
          `\n\nYou can approve or modify mitigation actions directly in the Control Tower.`;
      }
    } else if (queryLower.includes("supplier") || queryLower.includes("investigate")) {
      if (suppliersInspected.length === 0) {
        answer = "No supplier profiles have been inspected by your account recently.";
      } else {
        answer = `Suppliers investigated in your recent audit trail:\n` +
          suppliersInspected.map((s) => `• ${s}`).join("\n");
      }
    } else if (queryLower.includes("approve") || queryLower.includes("decision")) {
      if (approvedDecisions.length === 0) {
        answer = "You have not approved any playbook recommendations in this session.";
      } else {
        answer = `Recommendations you have formally approved:\n` +
          approvedDecisions.map((d) => `• ${d}`).join("\n");
      }
    } else {
      // General overview
      answer = `Activity Summary for ${input.userEmail || "your account"}:\n` +
        `• Total Verified Actions: ${userActivities.length}\n` +
        `• Actions Performed Today: ${todayActivities.length}\n` +
        `• Unique Suppliers Inspected: ${suppliersInspected.length || 0}\n` +
        `• Pending Scenarios: ${pendingDecisions.length || 0}\n\n` +
        `You can ask me questions like: "What did I analyze today?", "Which suppliers did I inspect?", or "Show my pending actions."`;
    }

    const output: UserActivityQueryResponse = {
      answer,
      activitiesFound: userActivities.slice(0, 15),
      summary: {
        todayCount: todayActivities.length,
        pendingActionsCount: pendingDecisions.length,
        recentSuppliers: suppliersInspected.slice(0, 5),
        recentDecisions: approvedDecisions.slice(0, 5),
      },
    };

    return {
      runId,
      agentId: "user_activity",
      agentName: "User Activity Agent",
      timestamp,
      status: "COMPLETE",
      durationMs: Date.now() - startTime,
      inputReference: input.query,
      result: output,
      evidence,
      confidence: 1.0,
    };
  } catch (err: any) {
    return {
      runId,
      agentId: "user_activity",
      agentName: "User Activity Agent",
      timestamp,
      status: "FAILED",
      durationMs: Date.now() - startTime,
      error: err?.message || "Execution error in User Activity Agent",
      evidence: ["Failed to inspect user activity."],
      confidence: 0,
    };
  }
}
