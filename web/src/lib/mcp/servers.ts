export interface MCPServerConfig {
  package: string;
  name: string;
  defaultEnvVars: string[];
  // Strategy to build arguments passed to the CLI process
  getArgs?: (envVars: Record<string, string>) => string[];
}

export const MCP_SERVERS: Record<string, MCPServerConfig> = {
  JIRA: {
    package: 'mcp-atlassian',
    name: 'Atlassian Jira',
    defaultEnvVars: [
      'JIRA_URL',
      'JIRA_USERNAME',
      'JIRA_API_TOKEN',
    ],
    // mcp-atlassian doesn't expect positional 'stdio', uses CLI options instead
    getArgs: (envVars) => {
      const args: string[] = [];
      const url = envVars.JIRA_URL || envVars.JIRA_HOST;
      const username = envVars.JIRA_USERNAME || envVars.JIRA_EMAIL;
      const token = envVars.JIRA_TOKEN || envVars.JIRA_API_TOKEN;

      if (url) args.push('--jira-url', url);
      if (username) args.push('--jira-username', username);
      if (token) args.push('--jira-token', token);
      
      if (envVars.CONFLUENCE_URL) args.push('--confluence-url', envVars.CONFLUENCE_URL);
      if (envVars.CONFLUENCE_USERNAME) args.push('--confluence-username', envVars.CONFLUENCE_USERNAME);
      if (envVars.CONFLUENCE_TOKEN) args.push('--confluence-token', envVars.CONFLUENCE_TOKEN);
      return args;
    },
  },
  TRELLO: {
    package: 'mcp-server-trello',
    name: 'Trello',
    defaultEnvVars: [
      'TRELLO_API_KEY',
      'TRELLO_TOKEN',
    ],
    getArgs: () => ['stdio'], // typical FastMCP packages require stdio
  },
  PLANE: {
    package: 'plane-mcp-server',
    name: 'Plane',
    defaultEnvVars: [
      'PLANE_API_KEY',
      'PLANE_WORKSPACE_SLUG',
      'PLANE_BASE_URL',
    ],
    getArgs: () => ['stdio'], // plane requires stdio
  },
};

export type Platform = keyof typeof MCP_SERVERS;
