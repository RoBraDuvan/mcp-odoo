#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { OdooClient } from './odoo-client.js';

// Configuration - URL, username and password from environment
const config = {
  url: process.env.ODOO_URL || 'http://localhost:8069',
  username: process.env.ODOO_USERNAME || 'admin',
  password: process.env.ODOO_PASSWORD || 'admin',
};

const odooClient = new OdooClient(config);

// Create MCP server
const server = new Server(
  {
    name: 'mcp-odoo-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'odoo_search',
        description: 'Search for records in an Odoo model using domain filters. Returns a list of record IDs.',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'The Odoo database name to connect to',
            },
            model: {
              type: 'string',
              description: 'The Odoo model name (e.g., "res.partner", "sale.order")',
            },
            domain: {
              type: 'array',
              description: 'Search domain as array of tuples [["field", "operator", "value"]]. Example: [["name", "ilike", "John"]]',
              items: {},
              default: [],
            },
            limit: {
              type: 'number',
              description: 'Maximum number of records to return',
              default: 100,
            },
            offset: {
              type: 'number',
              description: 'Number of records to skip',
              default: 0,
            },
            order: {
              type: 'string',
              description: 'Order by field (e.g., "name ASC", "create_date DESC")',
            },
          },
          required: ['database', 'model'],
        },
      },
      {
        name: 'odoo_search_read',
        description: 'Search and read records from an Odoo model in one call. Returns full record data.',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'The Odoo database name to connect to',
            },
            model: {
              type: 'string',
              description: 'The Odoo model name (e.g., "res.partner", "sale.order")',
            },
            domain: {
              type: 'array',
              description: 'Search domain as array of tuples [["field", "operator", "value"]]',
              items: {},
              default: [],
            },
            fields: {
              type: 'array',
              description: 'List of field names to return. Empty array returns all fields.',
              items: {
                type: 'string',
              },
              default: [],
            },
            limit: {
              type: 'number',
              description: 'Maximum number of records to return',
              default: 100,
            },
            offset: {
              type: 'number',
              description: 'Number of records to skip',
              default: 0,
            },
            order: {
              type: 'string',
              description: 'Order by field',
            },
          },
          required: ['database', 'model'],
        },
      },
      {
        name: 'odoo_read',
        description: 'Read specific records by their IDs from an Odoo model.',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'The Odoo database name to connect to',
            },
            model: {
              type: 'string',
              description: 'The Odoo model name',
            },
            ids: {
              type: 'array',
              description: 'Array of record IDs to read',
              items: {
                type: 'number',
              },
            },
            fields: {
              type: 'array',
              description: 'List of field names to return. Empty array returns all fields.',
              items: {
                type: 'string',
              },
              default: [],
            },
          },
          required: ['database', 'model', 'ids'],
        },
      },
      {
        name: 'odoo_create',
        description: 'Create a new record in an Odoo model.',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'The Odoo database name to connect to',
            },
            model: {
              type: 'string',
              description: 'The Odoo model name',
            },
            values: {
              type: 'object',
              description: 'Object with field names and values for the new record',
            },
          },
          required: ['database', 'model', 'values'],
        },
      },
      {
        name: 'odoo_write',
        description: 'Update existing records in an Odoo model.',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'The Odoo database name to connect to',
            },
            model: {
              type: 'string',
              description: 'The Odoo model name',
            },
            ids: {
              type: 'array',
              description: 'Array of record IDs to update',
              items: {
                type: 'number',
              },
            },
            values: {
              type: 'object',
              description: 'Object with field names and new values',
            },
          },
          required: ['database', 'model', 'ids', 'values'],
        },
      },
      {
        name: 'odoo_delete',
        description: 'Delete records from an Odoo model.',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'The Odoo database name to connect to',
            },
            model: {
              type: 'string',
              description: 'The Odoo model name',
            },
            ids: {
              type: 'array',
              description: 'Array of record IDs to delete',
              items: {
                type: 'number',
              },
            },
          },
          required: ['database', 'model', 'ids'],
        },
      },
      {
        name: 'odoo_fields_get',
        description: 'Get field definitions for an Odoo model.',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'The Odoo database name to connect to',
            },
            model: {
              type: 'string',
              description: 'The Odoo model name',
            },
            fields: {
              type: 'array',
              description: 'List of specific field names to get info for. Empty returns all fields.',
              items: {
                type: 'string',
              },
              default: [],
            },
            attributes: {
              type: 'array',
              description: 'List of attributes to return for each field (e.g., ["string", "type", "required"])',
              items: {
                type: 'string',
              },
              default: [],
            },
          },
          required: ['database', 'model'],
        },
      },
      {
        name: 'odoo_search_count',
        description: 'Count records matching a domain in an Odoo model.',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'The Odoo database name to connect to',
            },
            model: {
              type: 'string',
              description: 'The Odoo model name',
            },
            domain: {
              type: 'array',
              description: 'Search domain as array of tuples',
              items: {},
              default: [],
            },
          },
          required: ['database', 'model'],
        },
      },
      {
        name: 'odoo_list_databases',
        description: 'List all available databases on the Odoo server. This helps discover which databases are available to connect to.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'odoo_search': {
        const { database, model, domain = [], limit = 100, offset = 0, order } = args;
        const options = { limit, offset };
        if (order) options.order = order;

        const result = await odooClient.search(database, model, domain, options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'odoo_search_read': {
        const { database, model, domain = [], fields = [], limit = 100, offset = 0, order } = args;
        const options = { limit, offset };
        if (order) options.order = order;

        const result = await odooClient.searchRead(database, model, domain, fields, options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'odoo_read': {
        const { database, model, ids, fields = [] } = args;
        const result = await odooClient.read(database, model, ids, fields);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'odoo_create': {
        const { database, model, values } = args;
        const result = await odooClient.create(database, model, values);
        return {
          content: [
            {
              type: 'text',
              text: `Record created successfully with ID: ${result}`,
            },
          ],
        };
      }

      case 'odoo_write': {
        const { database, model, ids, values } = args;
        const result = await odooClient.write(database, model, ids, values);
        return {
          content: [
            {
              type: 'text',
              text: result ? 'Records updated successfully' : 'Update failed',
            },
          ],
        };
      }

      case 'odoo_delete': {
        const { database, model, ids } = args;
        const result = await odooClient.unlink(database, model, ids);
        return {
          content: [
            {
              type: 'text',
              text: result ? 'Records deleted successfully' : 'Delete failed',
            },
          ],
        };
      }

      case 'odoo_fields_get': {
        const { database, model, fields = [], attributes = [] } = args;
        const result = await odooClient.fieldsGet(database, model, fields, attributes);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'odoo_search_count': {
        const { database, model, domain = [] } = args;
        const result = await odooClient.searchCount(database, model, domain);
        return {
          content: [
            {
              type: 'text',
              text: `Count: ${result}`,
            },
          ],
        };
      }

      case 'odoo_list_databases': {
        const result = await odooClient.listDatabases();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Odoo Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});