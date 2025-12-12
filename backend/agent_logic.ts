// import 'dotenv/config'; 

// import { Anthropic } from '@anthropic-ai/sdk';
// import { GoogleDocsWriterTool, WriteDocArgs} from "./googleDocsTool.ts"; 

// export function getRequiredEnv(name: string): string {
//     const value = process.env[name]; 
//     if (!value) {
//       throw new Error(`Environment variable ${name} is not set`);
//     }
//     return value;
// }

// // 在这里我想使用@corespeed/zypher，但是由于我想用他的tool&toolArgument，路径始终显示错误，我mock一下，使用anthropic

// export class AnthropicMiniAgent {
//     private client: Anthropic;
//     public tools: Map<string, GoogleDocsWriterTool>;

//     constructor(apiKey: string) {
//         this.client = new Anthropic({ apiKey });
//         this.tools = new Map();
//         console.log("--- Anthropic Mini-Agent Initialized (Non-Zypher Mode) ---");
//     }

//     public registerTool(tool: GoogleDocsWriterTool): void {
//         this.tools.set(tool.name, tool);
//         console.log(`[Mini-Agent] Registered tool: ${tool.name}`);
//     }

//     public async runTask(prompt: string, model: string): Promise<string> {
//         const docTool = this.tools.get("google_docs_writer");
//         if (!docTool) {
//             return "Error: google_docs_writer tool not registered.";
//         }
        
//         const toolsDefinition = [{
//             name: docTool.name,
//             description: docTool.description,
//             input_schema: {
//                 type: 'object' as const,
//                 properties: docTool.args
//             }
//         }];

//         const initialResponse = await this.client.messages.create({
//             model: model,
//             max_tokens: 4096,
//             system: "You are an expert academic essay writer. Your ONLY goal is to fulfill the user's request. You MUST generate the full essay content, and then **IMMEDIATELY and ONLY output a single tool call** to 'google_docs_writer' using that content. DO NOT RETURN ANY TEXT, GREETINGS, OR EXPLANATIONS IN THE FIRST RESPONSE.",            
//             messages: [{ role: 'user', content: prompt }],
//             tools: toolsDefinition,
//         });

//         const firstContent = initialResponse.content[0]; 

//         if (firstContent.type === 'tool_use' && firstContent.id) {
            
//             const toolCallArgs = firstContent.input as WriteDocArgs;

//             const essayContent = toolCallArgs.content; 

//             const toolOutput = await docTool.execute(toolCallArgs);

//             if (toolOutput.startsWith('error while writing into google doc file:')) {
//                 // 如果是错误，立即返回完整的错误信息
//                 console.error(`🚨 Tool Execution Failed: ${toolOutput}`);
//                 return `🚨 Document Creation Failed: ${toolOutput}`;
//             }

//             const linkRegex = /(Link: https:\/\/docs\.google\.com\/document\/[^/]+\/edit\?usp=drivesdk)/;
//             const linkMatch = toolOutput.match(linkRegex);
//             const docLinkSegment = linkMatch ? linkMatch[0] : 'Link not found in tool output.'; 
            
//             const finalResponseText = `${docLinkSegment}\n\n${essayContent}`;

//             return finalResponseText;

//         } else {
//             return (firstContent as any).text || "Error: LLM did not call the google_docs_writer tool.";
//         }

//         // if (firstContent.type !== 'tool_use') {
//         //     console.error("🚨 Agent failed to call tool. Returned text instead:", firstContent.type);
//         //     return `Error: Agent failed to call tool in the first step. Received type: ${firstContent.type}.`;
//         // }

//         // return "Task completed without a clear final response or tool call.";
//     }
// }

// // async function run() {
// //     try {
// //         const anthropicApiKey = getRequiredEnv("ANTHROPIC_API_KEY");

// //         const agent = new AnthropicMiniAgent(anthropicApiKey);

// //         const googleDocsTool = new GoogleDocsWriterTool();
// //         agent.tools.set(googleDocsTool.name, googleDocsTool); 
// //         agent.registerTool(googleDocsTool);

// //         console.log("--- AI Agent Initialized. Tool 'google_docs_writer' registered. ---");
        
// //         // 在这里仅供测试，因为我们还没有前端，文章标题需要在这里改
// //         const taskPrompt = `
// // Your task is to act as an academic essay writer.
// // 1. First, generate a comprehensive 1000-word essay on the topic "why apple is a great company" The essay must be complete with an introduction, several body paragraphs, and a conclusion.
// // 2. After generating the content, **you must use the 'google_docs_writer' tool** to create a new Google Doc.
// // 3. The tool arguments should be: 
// //    - title: 'why apple is a great company'
// //    - content: The full essay text you generated in step 1.
// //    - format: 'MLA'
// // `;

// //         console.log(`Running Task with LLM: claude`);
// //         console.log(`Prompt: "${taskPrompt.trim()}"`);
        
// //         const finalResponseText = await agent.runTask(
// //             taskPrompt,
// //             "claude-3-haiku-20240307", // 这里也有一个问题，我想使用sonnet但一直显示无法访问
// //         );

// //         if (finalResponseText) {
// //             console.log("\n--- Final Agent Response (Includes Tool Result) ---");
// //             console.log(finalResponseText);
// //             console.log("-------------------------------------------------");
// //         }

// //     } catch (error) {
// //         console.error("🚨 An unhandled error occurred during execution:", error);
// //     }
// // }

// // run();

// agent_logic.ts
import 'dotenv/config';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleDocsWriterTool, createOAuthClient } from './googleDocsTool.ts';

function optionalEnv(name: string) {
  return process.env[name] ?? '';
}

async function generateContentFromClaude(prompt: string): Promise<string> {
  const apiKey = optionalEnv('ANTHROPIC_API_KEY');
  if (!apiKey) {
    // 允许没有 key 也能跑通链路：仅用于测试写入
    return `NO_ANTHROPIC_API_KEY: This is a placeholder content.\n\nPrompt:\n${prompt}`;
  }

  const client = new Anthropic({ apiKey });

  const model = optionalEnv('ANTHROPIC_MODEL') || 'claude-3-haiku-20240307';

  const msg = await client.messages.create({
    model,
    max_tokens: 1800,
    messages: [{ role: 'user', content: prompt }],
  });

  // Anthropic SDK returns array content
  const parts = msg.content
    .map((c: any) => (c.type === 'text' ? c.text : ''))
    .filter(Boolean);

  return parts.join('\n').trim();
}

export async function runTask(prompt: string) {
  // 1) LLM generate
  const generatedText = await generateContentFromClaude(prompt);

  // 2) Write doc to Drive via OAuth
  const oauth2Client = createOAuthClient();
  const writer = new GoogleDocsWriterTool(oauth2Client);

  const folderId = optionalEnv('DOCS_FOLDER_ID') || undefined;

  const title = `AI Doc - ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;

  const writeRes = await writer.writeDoc({
    title,
    content: generatedText,
    folderId,
  });

  if (!writeRes.success) {
    return {
      success: false,
      result: generatedText,
      error: writeRes.message || 'Failed to create/write Google Doc.',
    };
  }

  return {
    success: true,
    result: generatedText,
    link: writeRes.link,
    id: writeRes.id,
  };
}
