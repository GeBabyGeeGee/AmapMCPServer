#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const API_KEY = process.env.AMAP_API_KEY;

if (!API_KEY) {
  throw new Error('AMAP_API_KEY environment variable is required');
}

interface CoordinateConvertArgs {
  locations: string;
  coordsys?: string;
  output?: string;
}

interface KeywordSearchArgs {
  keywords: string;
  types?: string;
  city?: string;
  citylimit?: boolean;
  children?: number;
  offset?: number;
  page?: number;
  extensions?: string;
}

interface AroundSearchArgs {
  location: string;
  keywords?: string;
  types?: string;
  city?: string;
  radius?: number;
  sortrule?: string;
  offset?: number;
  page?: number;
  extensions?: string;
}

interface PolygonSearchArgs {
  polygon: string;
  keywords?: string;
  types?: string;
  offset?: number;
  page?: number;
  extensions?: string;
}

interface IDSearchArgs {
  id: string;
}

interface AOIBoundaryQueryArgs {
  id: string;
}

type SearchArgs =
  | CoordinateConvertArgs
  | KeywordSearchArgs
  | AroundSearchArgs
  | PolygonSearchArgs
  | IDSearchArgs
  | AOIBoundaryQueryArgs;

const isValidSearchArgs = (args: any): args is SearchArgs => {
  if (typeof args !== 'object' || args === null) {
    return false;
  }

  if ('locations' in args) {
    return (
      typeof args.locations === 'string' &&
      (args.coordsys === undefined || typeof args.coordsys === 'string') &&
      (args.output === undefined || typeof args.output === 'string')
    );
  } else if ('keywords' in args) {
    return typeof args.keywords === 'string';
  } else if ('location' in args) {
    return typeof args.location === 'string';
  } else if ('polygon' in args) {
    return typeof args.polygon === 'string';
  } else if ('id' in args) {
    return typeof args.id === 'string';
  }

  return false;
};

class AmapCoordinateServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'amap-coordinate-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'coordinate_convert',
          description: 'Convert coordinates using AMap API',
          inputSchema: {
            type: 'object',
            properties: {
              locations: {
                type: 'string',
                description:
                  'Coordinates to convert (longitude,latitude|longitude,latitude)',
              },
              coordsys: {
                type: 'string',
                description: 'Original coordinate system (gps, mapbar, baidu, autonavi)',
                enum: ['gps', 'mapbar', 'baidu', 'autonavi'],
              },
              output: {
                type: 'string',
                description: 'Output format (JSON, XML)',
                enum: ['JSON', 'XML'],
              },
            },
            required: ['locations'],
          },
        },
        {
          name: 'keyword_search',
          description: 'Search for places by keyword using AMap API',
          inputSchema: {
            type: 'object',
            properties: {
              keywords: {
                type: 'string',
                description: 'Keywords for the search',
              },
              types: {
                type: 'string',
                description: 'POI types',
              },
              city: {
                type: 'string',
                description: 'City to search in',
              },
              citylimit: {
                type: 'boolean',
                description: 'Limit results to the specified city',
              },
              children: {
                type: 'number',
                description: 'Whether to show child POIs',
              },
              offset: {
                type: 'number',
                description: 'Number of results per page',
              },
              page: {
                type: 'number',
                description: 'Page number',
              },
              extensions: {
                type: 'string',
                description: 'Return extensions',
              },
            },
            required: ['keywords'],
          },
        },
        {
          name: 'around_search',
          description: 'Search for places around a location using AMap API',
          inputSchema: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'Location to search around (longitude,latitude)',
              },
              keywords: {
                type: 'string',
                description: 'Keywords for the search',
              },
              types: {
                type: 'string',
                description: 'POI types',
              },
              city: {
                type: 'string',
                description: 'City to search in',
              },
              radius: {
                type: 'number',
                description: 'Search radius',
              },
              sortrule: {
                type: 'string',
                description: 'Sort rule',
              },
              offset: {
                type: 'number',
                description: 'Number of results per page',
              },
              page: {
                type: 'number',
                description: 'Page number',
              },
              extensions: {
                type: 'string',
                description: 'Return extensions',
              },
            },
            required: ['location'],
          },
        },
        {
          name: 'polygon_search',
          description: 'Search for places within a polygon using AMap API',
          inputSchema: {
            type: 'object',
            properties: {
              polygon: {
                type: 'string',
                description:
                  'Polygon to search within (longitude,latitude|longitude,latitude|...)',
              },
              keywords: {
                type: 'string',
                description: 'Keywords for the search',
              },
              types: {
                type: 'string',
                description: 'POI types',
              },
              offset: {
                type: 'number',
                description: 'Number of results per page',
              },
              page: {
                type: 'number',
                description: 'Page number',
              },
              extensions: {
                type: 'string',
                description: 'Return extensions',
              },
            },
            required: ['polygon'],
          },
        },
        {
          name: 'id_search',
          description: 'Search for a place by ID using AMap API',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'ID of the place to search for',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'aoi_boundary_query',
          description: 'Query AOI boundary using AMap API',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'ID of the AOI to query',
              },
            },
            required: ['id'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'coordinate_convert':
          if (!isValidSearchArgs(args)) {
            throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments');
          }

          const { locations, coordsys, output } = args as CoordinateConvertArgs;

          try {
            const response = await axios.get(
              'https://restapi.amap.com/v3/assistant/coordinate/convert',
              {
                params: {
                  locations: locations,
                  coordsys: coordsys,
                  output: output,
                  key: API_KEY,
                },
              }
            );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error: any) {
          console.error(error);
          return {
            content: [
              {
                type: 'text',
                text: `AMap API error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        break;
      case 'keyword_search':
        if (!isValidSearchArgs(args)) {
          throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments');
        }

        const { keywords: keywords_ks, types: types_ks, city: city_ks, citylimit: citylimit_ks, children: children_ks, offset: offset_ks, page: page_ks, extensions: extensions_ks } =
          args as KeywordSearchArgs;

        try {
          const response = await axios.get(
            'https://restapi.amap.com/v3/place/text',
            {
              params: {
                key: API_KEY,
                keywords: keywords_ks,
                types: types_ks,
                city: city_ks,
                citylimit: citylimit_ks,
                children: children_ks,
                offset: offset_ks,
                page: page_ks,
                extensions: extensions_ks,
              },
            }
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error: any) {
          console.error(error);
          return {
            content: [
              {
                type: 'text',
                text: `AMap API error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        break;
      case 'around_search':
        if (!isValidSearchArgs(args)) {
          throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments');
        }

        const { location, keywords: keywords_as, types: types_as, city: city_as, radius: radius_as, sortrule: sortrule_as, offset: offset_as, page: page_as, extensions: extensions_as } =
          args as AroundSearchArgs;

          try {
            const response = await axios.get(
              'https://restapi.amap.com/v3/place/around',
              {
                params: {
                  key: API_KEY,
                  location: location,
                  keywords: keywords_as,
                  types: types_as,
                  city: city_as,
                  radius: radius_as,
                  sortrule: sortrule_as,
                  offset: offset_as,
                  page: page_as,
                  extensions: extensions_as,
                },
              }
            );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error: any) {
          console.error(error);
          return {
            content: [
              {
                type: 'text',
                text: `AMap API error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        break;
      case 'polygon_search':
        if (!isValidSearchArgs(args)) {
          throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments');
        }

        const { polygon, keywords: keywords_ps, types: types_ps, offset: offset_ps, page: page_ps, extensions: extensions_ps } =
          args as PolygonSearchArgs;

        try {
          const response = await axios.get(
            'https://restapi.amap.com/v3/place/polygon',
            {
              params: {
                key: API_KEY,
                polygon: polygon,
                keywords: keywords_ps,
                types: types_ps,
                offset: offset_ps,
                page: page_ps,
                extensions: extensions_ps,
              },
            }
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error: any) {
          console.error(error);
          return {
            content: [
              {
                type: 'text',
                text: `AMap API error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        break;
      case 'id_search':
        if (!isValidSearchArgs(args)) {
          throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments');
        }

        const { id: id_is } = args as IDSearchArgs;

        try {
          const response = await axios.get(
            'https://restapi.amap.com/v3/place/detail',
            {
              params: {
                key: API_KEY,
                id: id_is,
              },
            }
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error: any) {
          console.error(error);
          return {
            content: [
              {
                type: 'text',
                text: `AMap API error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        break;
      case 'aoi_boundary_query':
        if (!isValidSearchArgs(args)) {
          throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments');
        }

        const { id: id_abq } = args as AOIBoundaryQueryArgs;

        try {
          const response = await axios.get(
            'https://restapi.amap.com/v5/aoi/polyline',
            {
              params: {
                key: API_KEY,
                id: id_abq,
              },
            }
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error: any) {
          console.error(error);
          return {
            content: [
              {
                type: 'text',
                text: `AMap API error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        break;
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AMap Coordinate MCP server running on stdio');
  }
}

const server = new AmapCoordinateServer();
server.run().catch(console.error);
