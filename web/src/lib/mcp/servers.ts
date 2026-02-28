export const MCP_SERVERS = {
  JIRA: {
    package: 'atlassian-mcp-server',
    name: 'Atlassian Jira',
    defaultEnvVars: [
      'JIRA_HOST',
      'JIRA_EMAIL',
      'JIRA_API_TOKEN',
    ],
  },
  TRELLO: {
    package: 'mcp-server-trello',
    name: 'Trello',
    defaultEnvVars: [
      'TRELLO_API_KEY',
      'TRELLO_TOKEN',
    ],
  },
  PLANE: {
    package: 'plane-mcp-server',
    name: 'Plane',
    defaultEnvVars: [
      'PLANE_API_KEY',
      'PLANE_WORKSPACE_SLUG',
      'PLANE_BASE_URL',
    ],
  },
} as const;

export type Platform = keyof typeof MCP_SERVERS;
