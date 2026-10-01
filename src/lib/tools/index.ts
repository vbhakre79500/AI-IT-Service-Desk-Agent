import { ToolDefinition, UserRole } from '@/types';
import {
  searchKnowledgeBaseTool,
  searchPreviousTicketsTool,
  checkSystemStatusTool,
  checkUserAccountTool,
  checkDeviceStatusTool,
  checkNetworkStatusTool,
  runDiagnosticsTool,
  clearApplicationCacheTool,
  unlockAccountTool,
  resetPasswordTool,
  restartServiceTool,
  createTicketTool,
  updateTicketTool,
  closeTicketTool,
  escalateTicketTool,
} from './implementations';

export const ALL_TOOLS: ToolDefinition[] = [
  searchKnowledgeBaseTool,
  searchPreviousTicketsTool,
  checkSystemStatusTool,
  checkUserAccountTool,
  checkDeviceStatusTool,
  checkNetworkStatusTool,
  runDiagnosticsTool,
  clearApplicationCacheTool,
  unlockAccountTool,
  resetPasswordTool,
  restartServiceTool,
  createTicketTool,
  updateTicketTool,
  closeTicketTool,
  escalateTicketTool,
];

const TOOL_MAP = new Map<string, ToolDefinition>();
for (const tool of ALL_TOOLS) {
  TOOL_MAP.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | undefined {
  return TOOL_MAP.get(name);
}

export function listAvailableTools(userRole?: UserRole): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.enabled);
}

/**
 * Generates structured JSON documentation of available tools for LLM prompting
 */
export function getToolsPromptDescription(): string {
  return ALL_TOOLS.filter((t) => t.enabled)
    .map((t) => {
      return `Tool: "${t.name}"
Description: ${t.description}
Risk Level: ${t.riskLevel}
Requires Approval: ${t.requiresApproval ? 'YES (Human-in-the-loop)' : 'NO'}
Permitted Role: ${t.requiredRole}
`;
    })
    .join('\n');
}
