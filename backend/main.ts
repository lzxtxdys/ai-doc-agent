// import 'dotenv/config'; 
// import express, { Request, Response } from 'express';

// import { AnthropicMiniAgent, getRequiredEnv } from './agent_logic'; 
// import { GoogleDocsWriterTool } from './googleDocsTool';
// const app = express();
// const port = 3001;

// app.use(express.json());

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*'); 
//     res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//     if (req.method === 'OPTIONS') {
//         return res.sendStatus(200);
//     }
//     next();
// });

// let agent: AnthropicMiniAgent;
// let googleDocsTool: GoogleDocsWriterTool;

// try {
//     const anthropicApiKey = getRequiredEnv("ANTHROPIC_API_KEY");
//     agent = new AnthropicMiniAgent(anthropicApiKey);

//     googleDocsTool = new GoogleDocsWriterTool();
//     agent.registerTool(googleDocsTool);

//     console.log("--- AI Agent Initialization Complete. Ready to serve. ---");
// } catch (error) {
//     console.error("🚨 Fatal Error during Agent initialization:", error);
//     process.exit(1);
// }


// app.post('/api/run-agent', async (req: Request, res: Response) => {
//     const { prompt } = req.body; 
    
//     if (!prompt) {
//         return res.status(400).json({ success: false, error: "Missing 'prompt' in request body." });
//     }

//     const modelId = "claude-3-haiku-20240307"; 

//     try {
//         console.log(`\n[API] Running task for prompt: ${prompt.substring(0, 50)}...`);

//         const finalResponseText = await agent.runTask(prompt, modelId);

//         res.json({ success: true, result: finalResponseText });
        
//     } catch (error) {
//         console.error("🚨 Agent Execution Error:", error);
//         res.status(500).json({ success: false, error: "Agent task failed due to an internal error." });
//     }
// });


// app.listen(port, () => {
//     console.log(`🚀 Backend Agent Server listening at http://localhost:${port}`);
// });


// main.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import { runTask } from './agent_logic.ts';

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT || 3001);

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Environment variable ${name} is not set`);
  return v;
}

// ---------- OAuth helper endpoints ----------
function buildOAuthClient() {
  const clientId = getRequiredEnv('GCP_CLIENT_ID');
  const clientSecret = getRequiredEnv('GCP_CLIENT_SECRET');
  //console.log('OAUTH CLIENT ID IN USE:', clientId);
  return new google.auth.OAuth2(clientId, clientSecret, `http://localhost:${port}/oauth2/callback`);
}

// Start OAuth flow (open this in browser)
app.get('/oauth2/start', (req, res) => {
  const oauth2Client = buildOAuthClient();

  const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force refresh_token every time
    scope: scopes,
  });

  //console.log('AUTH URL:', url); // 👈 加这一行
  res.redirect(url);
});

// OAuth callback: exchange code for tokens
app.get('/oauth2/callback', async (req, res) => {
  try {
    const code = String(req.query.code || '');
    if (!code) return res.status(400).send('Missing code');

    const oauth2Client = buildOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // tokens.refresh_token is what you need in .env
    res.type('text/plain').send(
      [
        'OAuth success ✅',
        '',
        `access_token: ${tokens.access_token ?? ''}`,
        `refresh_token: ${tokens.refresh_token ?? ''}`,
        '',
        'Put refresh_token into your .env as GCP_REFRESH_TOKEN',
      ].join('\n')
    );

    //console.log('✅ OAuth tokens:', tokens);
  } catch (e: any) {
    console.error('OAuth callback error:', e);
    res.status(500).send(e?.message || 'OAuth callback failed');
  }
});

// ---------- Agent API ----------
app.post('/api/run-agent', async (req, res) => {
  try {
    const { prompt } = req.body as { prompt?: string };
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }

    const taskResult = await runTask(prompt.trim());

    if (!taskResult.success) {
      return res.status(500).json({
        success: false,
        error: taskResult.error || 'Agent failed',
        result: taskResult.result || '',
      });
    }

    return res.json({
      success: true,
      result: taskResult.result,
      link: taskResult.link,
      id: taskResult.id,
    });
  } catch (error: any) {
    console.error('🚨 Agent Execution Error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'internal error' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend Agent Server listening at http://localhost:${port}`);
  console.log(`🔑 OAuth start URL: http://localhost:${port}/oauth2/start`);
});
