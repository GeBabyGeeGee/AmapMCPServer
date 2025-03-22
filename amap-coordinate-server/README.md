# amap-coordinate-server MCP Server

A Model Context Protocol server for AMap Coordinate Conversion and Place Search.

This server provides tools to convert coordinates between different systems and search for places using the AMap API.

## Features

### Tools

-   `coordinate_convert`: Converts coordinates between different coordinate systems (GPS, mapbar, baidu, autonavi).
-   `keyword_search`: Searches for places by keyword.
-   `around_search`: Searches for places around a specific location.
-   `polygon_search`: Searches for places within a given polygon.
-   `id_search`: Searches for a place by its ID.
-   `aoi_boundary_query`: Queries the boundary of an Area of Interest (AOI).

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
    "amap-coordinate-server": {
      "command": "/path/to/amap-coordinate-server/build/index.js",
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
