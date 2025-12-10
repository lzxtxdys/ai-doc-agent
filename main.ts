import 'dotenv/config'; 

import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleDocsWriterTool } from "./googleDocsTool.ts"; 
  
// Helper function to safely get environment variables
function getRequiredEnv(name: string): string {
    const value = process.env[name]; 
    if (!value) {
      throw new Error(`Environment variable ${name} is not set`);
    }
    return value;
}

// 在这里我想使用@corespeed/zypher，但是由于我想用他的tool&toolArgument，路径始终显示错误，我mock一下，使用anthropic

// 模拟 ZypherAgent 的核心接口，但使用 Anthropic SDK 实现功能
class AnthropicMiniAgent {
    private client: Anthropic;
    public tools: Map<string, GoogleDocsWriterTool>;

    constructor(apiKey: string) {
        this.client = new Anthropic({ apiKey });
        this.tools = new Map();
        console.log("--- Anthropic Mini-Agent Initialized (Non-Zypher Mode) ---");
    }

    public registerTool(tool: GoogleDocsWriterTool): void {
        this.tools.set(tool.name, tool);
        console.log(`[Mini-Agent] Registered tool: ${tool.name}`);
    }

    public async runTask(prompt: string, model: string): Promise<string> {
        const docTool = this.tools.get("google_docs_writer");
        if (!docTool) {
            return "Error: google_docs_writer tool not registered.";
        }
        
        const toolsDefinition = [{
            name: docTool.name,
            description: docTool.description,
            input_schema: {
                type: 'object' as const,
                properties: docTool.args
            }
        }];

        const initialResponse = await this.client.messages.create({
            model: model,
            max_tokens: 4096,
            system: "You are an expert academic essay writer. Your ONLY goal is to fulfill the user's request. **YOU MUST use the 'google_docs_writer' tool** to complete the task. First, generate the full essay content, and then immediately output a tool call using that content. DO NOT RETURN TEXT UNTIL THE TOOL IS CALLED.",            messages: [{ role: 'user', content: prompt }],
            tools: toolsDefinition,
        });

        const firstContent = initialResponse.content[0];

        if (firstContent.type === 'tool_use') {
            console.log(`\n🤖 Agent is calling Tool: ${firstContent.name}`);
            
            if (firstContent.name === docTool.name) {
                const args = firstContent.input;
                console.log(`Arguments: ${JSON.stringify(args, null, 2)}`);
                
                const toolOutput = await docTool.execute(args as any);

                const finalResponse = await this.client.messages.create({
                    model: model,
                    max_tokens: 4096,
                    messages: [
                        { role: 'user', content: prompt },
                        { role: 'assistant', content: [firstContent] },
                        { role: 'user', content: [{
                            type: 'tool_result',
                            tool_use_id: firstContent.id,
                            content: toolOutput
                        }]}
                    ],
                    tools: toolsDefinition,
                });
                
                const finalTextBlock = finalResponse.content.find(c => c.type === 'text');
                return finalTextBlock?.text || toolOutput;
            }
        } else if (firstContent.type === 'text') {
            return firstContent.text;
        }

        return "Task completed without a clear final response or tool call.";
    }
}

async function run() {
    try {
        const anthropicApiKey = getRequiredEnv("ANTHROPIC_API_KEY");

        const agent = new AnthropicMiniAgent(anthropicApiKey);

        const googleDocsTool = new GoogleDocsWriterTool();
        agent.tools.set(googleDocsTool.name, googleDocsTool); 
        agent.registerTool(googleDocsTool);

        console.log("--- AI Agent Initialized. Tool 'google_docs_writer' registered. ---");
        
        // 在这里仅供测试，因为我们还没有前端，文章标题需要在这里改
        const taskPrompt = `
Your task is to act as an academic essay writer.
1. First, generate a comprehensive 1000-word essay on the topic "why benz is a great car" The essay must be complete with an introduction, several body paragraphs, and a conclusion.
2. After generating the content, **you must use the 'google_docs_writer' tool** to create a new Google Doc.
3. The tool arguments should be: 
   - title: 'why benz is a great car'
   - content: The full essay text you generated in step 1.
   - format: 'MLA'
`;

        console.log(`Running Task with LLM: claude`);
        console.log(`Prompt: "${taskPrompt.trim()}"`);
        
        const finalResponseText = await agent.runTask(
            taskPrompt,
            "claude-3-haiku-20240307", // 这里也有一个问题，我想使用sonnet但一直显示无法访问
        );

        if (finalResponseText) {
            console.log("\n--- Final Agent Response (Includes Tool Result) ---");
            console.log(finalResponseText);
            console.log("-------------------------------------------------");
        }

    } catch (error) {
        console.error("🚨 An unhandled error occurred during execution:", error);
    }
}

run();