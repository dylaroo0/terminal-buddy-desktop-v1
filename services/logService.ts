import { writeTextFile, mkdir, exists, BaseDirectory } from '@tauri-apps/plugin-fs';
import { TerminalMessage } from '../types';

const LOG_DIR = 'TerminalBuddy_Logs';

export const saveSessionLog = async (languageId: string, messages: TerminalMessage[]): Promise<boolean> => {
    try {
        // Ensure log directory exists in Documents
        const dirExists = await exists(LOG_DIR, { baseDir: BaseDirectory.Document });
        if (!dirExists) {
            await mkdir(LOG_DIR, { baseDir: BaseDirectory.Document });
        }

        // Generate filename based on date (one file per day per language?) 
        // Or one per session? User said "time stamp it".
        // Let's do one file per day, appending? Or usually overwriting is easier for sync.
        // Let's do: session_YYYY-MM-DD.md
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${LOG_DIR}/${languageId}_${dateStr}.md`;

        let content = `# Terminal Buddy Session - ${languageId.toUpperCase()} - ${dateStr}\n\n`;

        messages.forEach(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString();
            content += `## [${time}] ${msg.type.toUpperCase()}\n`;
            content += `\`\`\`\n${msg.content}\n\`\`\`\n`;

            if (msg.educationalNote) {
                content += `> **💡 Note:** ${msg.educationalNote}\n\n`;
            }
            content += `\n---\n\n`;
        });

        await writeTextFile(filename, content, { baseDir: BaseDirectory.Document });
        return true;
    } catch (e) {
        console.error("Failed to save log:", e);
        return false;
    }
}
