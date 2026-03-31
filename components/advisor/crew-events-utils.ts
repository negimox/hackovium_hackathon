// Helper functions to extract information from crew events
import { CrewEvent } from "./use-crew-events";

interface EventsSummary {
  tasks: Array<{
    name: string;
    status: "started" | "completed" | "failed";
  }>;
  tools: Array<{
    name: string;
    input?: string;
    output?: string;
  }>;
  thoughts: Array<{
    type: "started" | "finished";
    content: string;
  }>;
  agents: Array<{
    name: string;
    role: string;
    answer?: string;
  }>;
}

export function summarizeCrewEvents(events: CrewEvent[]): EventsSummary {
  const summary: EventsSummary = {
    tasks: [],
    tools: [],
    thoughts: [],
    agents: [],
  };

  for (const event of events) {
    switch (event.type) {
      case "task_started":
        summary.tasks.push({
          name: event.task_name || "Unnamed task",
          status: "started",
        });
        break;

      case "task_completed":
        // Update task status to completed
        const startedTask = summary.tasks.find(
          (t) => t.name === event.task_name && t.status === "started",
        );
        if (startedTask) {
          startedTask.status = "completed";
        } else {
          summary.tasks.push({
            name: event.task_name || "Unnamed task",
            status: "completed",
          });
        }
        break;

      case "task_failed":
        const failedTask = summary.tasks.find(
          (t) => t.name === event.task_name && t.status === "started",
        );
        if (failedTask) {
          failedTask.status = "failed";
        } else {
          summary.tasks.push({
            name: event.task_name || "Unnamed task",
            status: "failed",
          });
        }
        break;

      case "tool_started":
        summary.tools.push({
          name: event.tool_name || "Unknown tool",
          input: event.tool_input,
        });
        break;

      case "tool_finished":
        // Find and update tool with output
        const tool = summary.tools.find(
          (t) => t.name === event.tool_name && !t.output,
        );
        if (tool) {
          tool.output = event.tool_output;
        } else {
          summary.tools.push({
            name: event.tool_name || "Unknown tool",
            output: event.tool_output,
          });
        }
        break;

      case "thought_started":
        summary.thoughts.push({
          type: "started",
          content: event.prompt || "",
        });
        break;

      case "thought_finished":
        summary.thoughts.push({
          type: "finished",
          content: event.response || "",
        });
        break;

      case "agent_started":
        summary.agents.push({
          name: event.agent_name || "Unnamed agent",
          role: event.agent_role || "",
        });
        break;

      case "agent_finished":
        const agent = summary.agents.find((a) => a.name === event.agent_name);
        if (agent) {
          agent.answer = event.final_answer;
        } else {
          summary.agents.push({
            name: event.agent_name || "Unnamed agent",
            role: "",
            answer: event.final_answer,
          });
        }
        break;

      case "agent_action":
        if (event.thought) {
          summary.thoughts.push({
            type: "started",
            content: event.thought,
          });
        }
        break;

      case "output":
        if (event.content) {
          summary.thoughts.push({
            type: "finished",
            content: event.content,
          });
        }
        break;
    }
  }

  return summary;
}

export function formatReasoningText(summary: EventsSummary): string {
  const parts: string[] = [];

  if (summary.agents.length > 0) {
    parts.push(
      `Agent${summary.agents.length > 1 ? "s" : ""}: ${summary.agents.map((a) => a.name).join(", ")}`,
    );
  }

  if (summary.tasks.length > 0) {
    const completedTasks = summary.tasks.filter(
      (t) => t.status === "completed",
    ).length;
    parts.push(`Completed ${completedTasks}/${summary.tasks.length} tasks`);
  }

  if (summary.tools.length > 0) {
    const uniqueTools = [...new Set(summary.tools.map((t) => t.name))];
    parts.push(`Tools used: ${uniqueTools.join(", ")}`);
  }

  if (summary.thoughts.length > 0 && summary.tools.length === 0) {
    parts.push("Agent reasoning in progress");
  }

  return parts.length > 0 ? parts.join(". ") : "Processing your request...";
}
