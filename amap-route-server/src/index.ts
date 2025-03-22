#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from 'node-fetch';

/**
 * Type alias for a note object.
 */
type Note = { title: string, content: string };

/**
 * Simple in-memory storage for notes.
 * In a real implementation, this would likely be backed by a database.
 */
const notes: { [id: string]: Note } = {
  "1": { title: "First Note", content: "This is note 1" },
  "2": { title: "Second Note", content: "This is note 2" }
};

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: "amap-route-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

/**
 * Handler for listing available notes as resources.
 * Each note is exposed as a resource with:
 * - A note:// URI scheme
 * - Plain text MIME type
 * - Human readable name and description (now including the note title)
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.entries(notes).map(([id, note]) => ({
      uri: `note:///${id}`,
      mimeType: "text/plain",
      name: note.title,
      description: `A text note: ${note.title}`
    }))
  };
});

/**
 * Handler for reading the contents of a specific note.
 * Takes a note:// URI and returns the note content as plain text.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const id = url.pathname.replace(/^\//, '');
  const note = notes[id];

  if (!note) {
    throw new Error(`Note ${id} not found`);
  }

  return {
    contents: [{
      uri: request.params.uri,
      mimeType: "text/plain",
      text: note.content
    }]
  };
});

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "walking_route",
        description: "Get walking route",
        inputSchema: {
          type: "object",
          properties: {
            origin: {
              type: "string",
              description: "Origin longitude and latitude"
            },
            destination: {
              type: "string",
              description: "Destination longitude and latitude"
            }
          },
          required: ["origin", "destination"]
        }
      },
      {
        name: "transit_route",
        description: "Get transit route",
        inputSchema: {
          type: "object",
          properties: {
            origin: {
              type: "string",
              description: "Origin longitude and latitude"
            },
            destination: {
              type: "string",
              description: "Destination longitude and latitude"
            },
            city: {
              type: "string",
              description: "City name"
            }
          },
          required: ["origin", "destination", "city"]
        }
      },
      {
        name: "driving_route",
        description: "Get driving route",
        inputSchema: {
          type: "object",
          properties: {
            origin: {
              type: "string",
              description: "Origin longitude and latitude"
            },
            destination: {
              type: "string",
              description: "Destination longitude and latitude"
            }
          },
          required: ["origin", "destination"]
        }
      },
      {
        name: "bicycling_route",
        description: "Get bicycling route",
        inputSchema: {
          type: "object",
          properties: {
            origin: {
              type: "string",
              description: "Origin longitude and latitude"
            },
            destination: {
              type: "string",
              description: "Destination longitude and latitude"
            }
          },
          required: ["origin", "destination"]
        }
      },
      {
        name: "distance",
        description: "Get distance between two points",
        inputSchema: {
          type: "object",
          properties: {
            origins: {
              type: "string",
              description: "Origin longitude and latitude, separated by |"
            },
            destination: {
              type: "string",
              description: "Destination longitude and latitude"
            }
          },
          required: ["origins", "destination"]
        }
      }
    ]
  };
});

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const apiKey = "ae4775b98c50d997cab4bcd6c769bf9b";
  switch (request.params.name) {
    case "walking_route": {
      const origin = String(request.params.arguments?.origin);
      const destination = String(request.params.arguments?.destination);
      if (!origin || !destination) {
        throw new Error("Origin and destination are required");
      }
      const url = `https://restapi.amap.com/v3/direction/walking?origin=${origin}&destination=${destination}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(data)
        }]
      };
    }
    case "transit_route": {
      const origin = String(request.params.arguments?.origin);
      const destination = String(request.params.arguments?.destination);
      const city = String(request.params.arguments?.city);
      if (!origin || !destination || !city) {
        throw new Error("Origin, destination and city are required");
      }
      const url = `https://restapi.amap.com/v3/direction/transit/integrated?origin=${origin}&destination=${destination}&city=${city}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(data)
        }]
      };
    }
    case "driving_route": {
      const origin = String(request.params.arguments?.origin);
      const destination = String(request.params.arguments?.destination);
      if (!origin || !destination) {
        throw new Error("Origin and destination are required");
      }
      const url = `https://restapi.amap.com/v3/direction/driving?origin=${origin}&destination=${destination}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(data)
        }]
      };
    }
    case "bicycling_route": {
      const origin = String(request.params.arguments?.origin);
      const destination = String(request.params.arguments?.destination);
      if (!origin || !destination) {
        throw new Error("Origin and destination are required");
      }
      const url = `https://restapi.amap.com/v4/direction/bicycling?origin=${origin}&destination=${destination}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(data)
        }]
      };
    }
    case "distance": {
      const origins = String(request.params.arguments?.origins);
      const destination = String(request.params.arguments?.destination);
      if (!origins || !destination) {
        throw new Error("Origins and destination are required");
      }
      const url = `https://restapi.amap.com/v3/distance?origins=${origins}&destination=${destination}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(data)
        }]
      };
    }
    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Handler that lists available prompts.
 * Exposes a single "summarize_notes" prompt that summarizes all notes.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "summarize_notes",
        description: "Summarize all notes",
      }
    ]
  };
});

/**
 * Handler for the summarize_notes prompt.
 * Returns a prompt that requests summarization of all notes, with the notes' contents embedded as resources.
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "summarize_notes") {
    throw new Error("Unknown prompt");
  }

  const embeddedNotes = Object.entries(notes).map(([id, note]) => ({
    type: "resource" as const,
    resource: {
      uri: `note:///${id}`,
      mimeType: "text/plain",
      text: note.content
    }
  }));

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please summarize the following notes:"
        }
      },
      ...embeddedNotes.map(note => ({
        role: "user" as const,
        content: note
      })),
      {
        role: "user",
        content: {
          type: "text",
          text: "Provide a concise summary of all the notes above."
        }
      }
    ]
  };
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Amap route server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
