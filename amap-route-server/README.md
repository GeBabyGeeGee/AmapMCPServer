# amap-route-server MCP Server

A Model Context Protocol server for AMap Route Planning.

This server provides tools to calculate routes using the AMap API for different transportation modes.

## Features

### Tools

-   `walking_route`: Calculates a walking route between two points.
-   `transit_route`: Calculates a transit route between two points.
-   `driving_route`: Calculates a driving route between two points.
-   `bicycling_route`: Calculates a bicycling route between two points.
-   `distance`: Calculates the distance between two points.

## Development

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "amap-route-server": {
      "command": "/path/to/amap-route-server/build/index.js",
      "env": {
        "AMAP_API_KEY": "YOUR_AMAP_API_KEY"
      }
    }
  }
}
```

**Note:** You need to obtain an AMap API key and set it as the `AMAP_API_KEY` environment variable.

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the \[MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
