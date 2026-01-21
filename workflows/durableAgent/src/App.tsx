import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useAgent } from "agents/react";
import { AgentStatus } from "./types";
import type { AgentState, StartWorkflowRequest, StartWorkflowResponse } from "./types";

type AppStatus = AgentStatus | "running";

// Step log entry for tracking workflow progress
interface StepLog {
  id: string;
  turn: number;
  tool: string;
  message: string;
  status: "running" | "complete" | "error";
  timestamp: Date;
}

export default function App() {
  const defaultTask = "What is the most used model for AI applications written in Python?";
  const [task, setTask] = useState(defaultTask);
  const [status, setStatus] = useState<AppStatus>(AgentStatus.IDLE);
  const [result, setResult] = useState<string>("");
  const [steps, setSteps] = useState<StepLog[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const stepsEndRef = useRef<HTMLDivElement | null>(null);
  const isSubmittingRef = useRef(false);

  // Auto-scroll steps panel to bottom when new steps are added
  useEffect(() => {
    if (stepsEndRef.current) {
      stepsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [steps]);

  // Connect to the Agent using the Agents SDK
  useAgent<AgentState>({
    agent: "research-agent",
    name: "default",
    onStateUpdate: (newState) => {
      // Ignore stale state from previous workflow when we just started a new one
      if (isSubmittingRef.current) return;

      setStatus(newState.status as AppStatus || AgentStatus.IDLE);

      // Extract turn number from state message
      const turnMatch = newState.message?.match(/Processing turn (\d+)/);
      const turnNum = turnMatch?.[1] ? parseInt(turnMatch[1]) : 1;

      // Extract tool name and create step log
      if (newState.message?.includes("Using tool:")) {
        const toolMatch = newState.message.match(/Using tool: (\w+)/);
        const toolName = toolMatch?.[1];
        if (toolMatch && toolName) {
          const newStep: StepLog = {
            id: `${Date.now()}-${toolName}`,
            turn: turnNum,
            tool: toolName,
            message: `Executing ${toolName}...`,
            status: "running",
            timestamp: new Date(),
          };

          setSteps((prev) => {
            const updated = prev.map((s) =>
              s.status === "running" ? { ...s, status: "complete" as const } : s
            );
            return [...updated, newStep];
          });
        }
      }

      // Handle completion
      if (newState.status === AgentStatus.COMPLETE) {
        setSteps((prev) =>
          prev.map((s) =>
            s.status === "running" ? { ...s, status: "complete" as const } : s
          )
        );
      }

      if ("result" in newState) {
        setResult(newState.result ?? "");
      }
    },
    onOpen: () => {
      console.log("Agent connected");
      setConnectionState("connected");
    },
    onClose: () => {
      console.log("Agent disconnected");
      setConnectionState("disconnected");
    },
    onError: () => {
      console.error("Agent connection error");
      setConnectionState("disconnected");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    setStatus("running");
    setResult("");
    setSteps([]);
    setCurrentTurn(1);

    // Add initial "thinking" step
    setSteps([
      {
        id: `${Date.now()}-init`,
        turn: 1,
        tool: "thinking",
        message: "Analyzing task and planning approach...",
        status: "running",
        timestamp: new Date(),
      },
    ]);

    try {
      isSubmittingRef.current = true;
      const requestBody: StartWorkflowRequest = { task };
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as StartWorkflowResponse;
      setInstanceId(data.instanceId);
      isSubmittingRef.current = false;
    } catch (error) {
      isSubmittingRef.current = false;
      setStatus(AgentStatus.ERROR);
      setSteps((prev) => [
        ...prev.map((s) => ({ ...s, status: "error" as const })),
        {
          id: `${Date.now()}-error`,
          turn: currentTurn,
          tool: "error",
          message: error instanceof Error ? error.message : "Failed to start workflow",
          status: "error" as const,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleReset = async () => {
    // Terminate workflow and reset agent state
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceId }),
    });

    setTask(defaultTask);
    setStatus(AgentStatus.IDLE);
    setResult("");
    setSteps([]);
    setCurrentTurn(0);
    setInstanceId(null);
  };

  const isRunning = status !== AgentStatus.IDLE && status !== AgentStatus.COMPLETE && status !== AgentStatus.ERROR;
  const showWorkspace = status !== AgentStatus.IDLE || steps.length > 0;
  const isComplete = status === AgentStatus.COMPLETE;

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="App">
      <div className="App--container">
        {/* Hero Section */}
        <div className="Hero">
          <div className="Hero--badge">
            <span className="Hero--badge-dot" />
            <span>Cloudflare Workflows + Agents</span>
            <span style={{ 
              marginLeft: "1rem", 
              fontSize: "0.75rem",
              color: connectionState === "connected" ? "#10b981" : connectionState === "connecting" ? "#f59e0b" : "#ef4444"
            }}>
              {connectionState === "connected" ? "● Connected" : connectionState === "connecting" ? "● Connecting..." : "● Disconnected"}
            </span>
          </div>
          <h1 className="Hero--title">Durable AI Agent</h1>
          <p className="Hero--description">
            Ask a question and watch the agent research, analyze, and synthesize an answer in real-time.
          </p>

          {/* Input Card */}
          <div className="InputCard">
            <form onSubmit={handleSubmit} className="InputCard--form">
              <div className={`InputCard--field ${isRunning ? "InputCard--field-disabled" : ""}`}>
                <input
                  type="text"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Ask a question..."
                  className="InputCard--input"
                  disabled={isRunning}
                />
              </div>

              <div className="InputCard--actions">
                {isRunning ? (
                  <>
                    <button type="button" disabled className="Button Button--loading">
                      <span className="Button--spinner" />
                      Running
                    </button>
                    <button type="button" onClick={handleReset} className="Button Button--secondary">
                      Reset
                    </button>
                  </>
                ) : (
                  <button type="submit" disabled={!task.trim()} className="Button Button--primary">
                    Start
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Workspace: Steps + Result side by side */}
        {showWorkspace && (
          <div className="Workspace">
            {/* Steps Panel */}
            <div className="StepsPanel">
              <div className="StepsPanel--header">
                <h2 className="StepsPanel--title">Steps</h2>
                {isComplete && (
                  <span className="StepsPanel--badge StepsPanel--badge-complete">Complete</span>
                )}
                {isRunning && (
                  <span className="StepsPanel--badge StepsPanel--badge-running">Running</span>
                )}
              </div>

              <div className="StepsPanel--list">
                {steps.map((step, index) => (
                  <div key={step.id} className="Step">
                    <div className="Step--indicator">
                      <div
                        className={`Step--dot ${
                          step.status === "complete"
                            ? "Step--dot-complete"
                            : step.status === "running"
                            ? "Step--dot-running"
                            : "Step--dot-error"
                        }`}
                      />
                      {index < steps.length - 1 && <div className="Step--connector" />}
                    </div>

                    <div className="Step--content">
                      <div className="Step--header">
                        <span className="Step--tool">{step.tool}</span>
                        <span className="Step--time">{formatTime(step.timestamp)}</span>
                      </div>
                      <p className="Step--message">{step.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={stepsEndRef} />
              </div>
            </div>

            {/* Result Panel */}
            <div className="ResultPanel">
              <div className="ResultPanel--header">
                <h2 className="ResultPanel--title">Result</h2>
              </div>

              <div className="ResultPanel--content">
                {result ? (
                  <div className="ResultPanel--markdown">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="ResultPanel--empty">
                    {isRunning ? (
                      <p>Waiting for result...</p>
                    ) : (
                      <p>Result will appear here</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
