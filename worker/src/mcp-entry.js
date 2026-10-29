// RPC-entrypoint for Workeren tingsvad-mcp (service binding med entrypoint = "TingMcp"). Logikken ligger i features/mcp.js,
// så den kan testes i Node uden cloudflare:workers. Den offentlige /api/ting-ai-proxy bruger fetch() og kan ikke nå hertil.
import { WorkerEntrypoint } from 'cloudflare:workers';
import { TingMcpLogik } from './features/mcp.js';

export class TingMcp extends WorkerEntrypoint {
  status(input) { return new TingMcpLogik(this.env).status(input); }
  protokol(input) { return new TingMcpLogik(this.env).protokol(input); }
  hittegods(input) { return new TingMcpLogik(this.env).hittegods(input); }
  gaestebog(input) { return new TingMcpLogik(this.env).gaestebog(input); }
  rejsSag(input) { return new TingMcpLogik(this.env).rejsSag(input); }
  stem(input) { return new TingMcpLogik(this.env).stem(input); }
  flytStol(input) { return new TingMcpLogik(this.env).flytStol(input); }
  arkiv(input) { return new TingMcpLogik(this.env).arkiv(input); }
  afgoer(input) { return new TingMcpLogik(this.env).afgoer(input); }
}
