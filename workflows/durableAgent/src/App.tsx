import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAgent } from 'agents/react';
import type { AgentState, BroadcastMessage } from '../worker/types';

interface Step {
	id: string;
	tool: string;
	status: 'running' | 'complete' | 'error';
	timestamp: Date;
}

export default function App() {
	const defaultTask = 'What is the most used model for AI applications written in Python?';
	const [task, setTask] = useState(defaultTask);
	const [steps, setSteps] = useState<Step[]>([]);
	const [connected, setConnected] = useState(false);
	const [agentState, setAgentState] = useState<AgentState>({ status: 'idle', message: '' });
	const stepsEndRef = useRef<HTMLDivElement>(null);

	const agent = useAgent<AgentState>({
		agent: 'research-agent',
		name: 'default',
		onStateUpdate: setAgentState,
		onMessage: (msg) => {
			try {
				const data = JSON.parse(msg.data) as BroadcastMessage;
				if (data.type === 'tool_call') {
					setSteps((prev) => [
						...prev.map((s) => (s.status === 'running' ? { ...s, status: 'complete' as const } : s)),
						{ id: `${Date.now()}-${data.tool}`, tool: data.tool, status: 'running', timestamp: new Date() },
					]);
				}
			} catch {
				// ignore non-JSON
			}
		},
		onOpen: () => setConnected(true),
		onClose: () => setConnected(false),
		onError: () => setConnected(false),
	});

	// Derive from agent state
	const status = agentState.status;
	const result = agentState.result ?? '';
	const isRunning = status === 'running';
	const isComplete = status === 'complete';
	const isError = status === 'error';
	const showWorkspace = status !== 'idle' || steps.length > 0;

	// Mark all steps complete/error when workflow finishes
	useEffect(() => {
		if (isComplete) {
			setSteps((prev) => prev.map((s) => (s.status === 'running' ? { ...s, status: 'complete' } : s)));
		} else if (isError) {
			setSteps((prev) => [
				...prev.map((s) => ({ ...s, status: 'error' as const })),
				{ id: `${Date.now()}-error`, tool: 'error', status: 'error', timestamp: new Date() },
			]);
		}
	}, [isComplete, isError]);

	// Auto-scroll steps
	useEffect(() => {
		stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [steps]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!task.trim() || !connected) return;

		setSteps([{ id: `${Date.now()}-init`, tool: 'thinking', status: 'running', timestamp: new Date() }]);

		try {
			await agent.call('startResearch', [task]);
		} catch (err) {
			console.error('Failed to start research:', err);
		}
	};

	const handleReset = async () => {
		if (!connected) return;

		try {
			await agent.call('reset');
			setTask(defaultTask);
			setSteps([]);
		} catch (err) {
			console.error('Failed to reset:', err);
		}
	};

	const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

	return (
		<div className="App">
			<div className="App--container">
				<div className="Hero">
					<div className="Hero--badge">
						<span className="Hero--badge-dot" />
						<span>Cloudflare Workflows + Agents</span>
						<span style={{ marginLeft: '1rem', fontSize: '0.75rem', color: connected ? '#10b981' : '#ef4444' }}>
							{connected ? '● Connected' : '● Disconnected'}
						</span>
					</div>
					<h1 className="Hero--title">Durable AI Agent</h1>
					<p className="Hero--description">Ask a question and watch the agent research, analyze, and synthesize an answer in real-time.</p>

					<div className="InputCard">
						<form onSubmit={handleSubmit} className="InputCard--form">
							<div className={`InputCard--field ${isRunning ? 'InputCard--field-disabled' : ''}`}>
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
									<button type="submit" disabled={!task.trim() || !connected} className="Button Button--primary">
										Start
									</button>
								)}
							</div>
						</form>
					</div>
				</div>

				{showWorkspace && (
					<div className="Workspace">
						<div className="StepsPanel">
							<div className="StepsPanel--header">
								<h2 className="StepsPanel--title">Steps</h2>
								{isComplete && <span className="StepsPanel--badge StepsPanel--badge-complete">Complete</span>}
								{isRunning && <span className="StepsPanel--badge StepsPanel--badge-running">Running</span>}
								{isError && <span className="StepsPanel--badge StepsPanel--badge-error">Error</span>}
							</div>
							<div className="StepsPanel--list">
								{steps.map((step, i) => (
									<div key={step.id} className="Step">
										<div className="Step--indicator">
											<div className={`Step--dot Step--dot-${step.status}`} />
											{i < steps.length - 1 && <div className="Step--connector" />}
										</div>
										<div className="Step--content">
											<div className="Step--header">
												<span className="Step--tool">{step.tool}</span>
												<span className="Step--time">{formatTime(step.timestamp)}</span>
											</div>
										</div>
									</div>
								))}
								<div ref={stepsEndRef} />
							</div>
						</div>

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
										<p>{isRunning ? 'Waiting for result...' : 'Result will appear here'}</p>
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
