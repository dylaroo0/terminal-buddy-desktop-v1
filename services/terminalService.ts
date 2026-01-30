import { Command } from '@tauri-apps/plugin-shell';
import { runTerminalCommand as runSimulatedCommand } from './geminiService';

export interface TerminalExecutionResult {
    output: string;
    cwd?: string;
    isError?: boolean;
}

// Helper to check if we are in Tauri environment
const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Keep track of current working directory for shell sessions
let currentShellPath = '.';

export const executeCommand = async (
    languageId: string,
    command: string,
    history: string[]
): Promise<TerminalExecutionResult> => {

    // 1. If running in Browser (not Tauri), use AI Simulation
    if (!isTauri()) {
        console.warn("Browser mode: Using AI Simulation. Setup Tauri for real execution.");
        const res = await runSimulatedCommand(languageId, command, history, false);
        return { output: res.output };
    }

    // 2. Real Execution Logic (Tauri Desktop)
    try {
        let cmd = null;

        // Map language IDs to actual executables
        if (languageId === 'linux' || languageId === 'bash') {
            // STATEFUL SHELL EXECUTION:
            // We verify the directory changes by chaining commands.
            // 1. cd to current path
            // 2. execute command
            // 3. print delimiter and new path

            const wrappedCommand = `cd "${currentShellPath}" 2>/dev/null; ${command}; echo "__CWD_SEP__"; pwd`;
            cmd = Command.create('bash', ['--norc', '-c', wrappedCommand]);

            // Safeguard: Timeout after 10s to prevent freezing on interactive commands
            const executeWithTimeout = async () => {
                const timeout = new Promise<any>((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout: Command execution took too long (>10s) or is waiting for input.")), 10000)
                );
                return Promise.race([cmd.execute(), timeout]);
            };

            const output = await executeWithTimeout();

            if (output.code === 0 || output.stdout.includes('__CWD_SEP__')) {
                // Parse stdout to extract new path
                const parts = output.stdout.split('__CWD_SEP__');
                const realOutput = parts[0].trim();
                const newPath = parts[1] ? parts[1].trim() : currentShellPath;

                // Update state
                if (newPath) currentShellPath = newPath;

                return { output: realOutput, cwd: currentShellPath };
            } else {
                return { output: output.stderr, isError: true, cwd: currentShellPath };
            }

        } else if (languageId === 'python') {
            cmd = Command.create('python3', ['-c', command]);
        } else if (languageId === 'javascript' || languageId === 'node') {
            cmd = Command.create('node', ['-e', command]);
        } else {
            const res = await runSimulatedCommand(languageId, command, history, false);
            return { output: "[AI Sim]: " + res.output };
        }

        // For non-shell languages (stateless execution)
        if (cmd) {
            const output = await cmd.execute();
            if (output.code === 0) {
                return { output: output.stdout };
            } else {
                return { output: output.stderr, isError: true };
            }
        }

    } catch (e: any) {
        return { output: `Execution Error: ${e.message || e}`, isError: true };
    }

    return { output: "Command not supported in real mode yet." };
};
