
import { google } from "googleapis"; 
// 在这里我想使用@corespeed/zypher，但是由于我想用他的tool&toolArgument，路径始终显示错误，我mock一下，使用anthropic


interface ToolArguments {}

/**
 * 模拟 Tool 抽象类。它必须拥有 Agent 框架期望的结构。
 * @param T - 工具参数的类型 (WriteDocArgs)
 */
abstract class Tool<T extends ToolArguments> {

    public abstract readonly name: string;
    public abstract readonly description: string;
    public abstract readonly args: Record<string, any>;

    public abstract execute(args: T): Promise<string>;
}

interface WriteDocArgs extends ToolArguments {
    title: string;
    content: string;
    format: "MLA" | "APA" | "General";
}

export class GoogleDocsWriterTool extends Tool<WriteDocArgs> {
    public readonly name = "google_docs_writer";
    public readonly description = "Creates a new Google Document with a given title, content, and applies basic formatting (like MLA or APA) using the Google Docs API. Returns the URL of the newly created document.";

    public readonly args = {
        title: {
            type: "string",
            description: "The title for the new Google Document (e.g., 'Black Lives Matter Essay').",
        },
        content: {
            type: "string",
            description: "The complete, generated body text of the document to be inserted.",
        },
        format: {
            type: "string",
            description: "The required academic format for the document ('MLA', 'APA', or 'General').",
        }
    };

    private async getAuthorizedClient() {
        const clientId = process.env.GCP_CLIENT_ID;
        const clientSecret = process.env.GCP_CLIENT_SECRET;
        const refreshToken = process.env.GCP_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error("Missing GCP_CLIENT_ID, GCP_CLIENT_SECRET, or GCP_REFRESH_TOKEN environment variables. Cannot authenticate Google Docs API.");
        }

        const oAuth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            'urn:ietf:wg:oauth:2.0:oob' 
        );

        oAuth2Client.setCredentials({
            refresh_token: refreshToken,
        });
        
        return oAuth2Client;
    }

    private generateFormattingRequests(format: WriteDocArgs['format'], docLength: number): any[] {
        const requests: any[] = [];

        const entireDocumentRange = { startIndex: 1, endIndex: docLength };
    
        const baseFormattingRequests: any[] = [
            {
                updateParagraphStyle: {
                    paragraphStyle: { lineSpacing: 200 },
                    fields: "lineSpacing",
                    range: entireDocumentRange
                }
            },
            {
                updateTextStyle: {
                    textStyle: {
                        fontSize: { magnitude: 12, unit: 'PT' },
                    },
                    fields: "fontSize",
                    range: entireDocumentRange
                }
            }
        ];
    
        if (format === "MLA" || format === "APA" || format === "General") {
             requests.push(...baseFormattingRequests);
        }
        
        return requests;
    }

    public async execute(args: WriteDocArgs): Promise<string> {
        const { title, content, format } = args;

        try {
            const authClient = await this.getAuthorizedClient();
            const docs = google.docs({ version: 'v1', auth: authClient });
            const drive = google.drive({ version: 'v3', auth: authClient });
            
            const createResponse = await drive.files.create({
                requestBody: {
                    name: title,
                    mimeType: 'application/vnd.google-apps.document',
                },
                fields: 'id,webViewLink',
            });

            const documentId = createResponse.data.id;
            const docLink = createResponse.data.webViewLink;

            if (!documentId || !docLink) {
                return `Error: Failed to create Google Doc titled ${title}.`;
            }
            
            const insertRequests = [{
                insertText: {
                    text: content,
                    endOfSegmentLocation: {} 
                }
            }];

            const contentUpdateResponse = await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: { requests: insertRequests }
            });

            // const docLength = contentUpdateResponse.data.replies?.[0]?.insertText?.['endIndex'] ?? content.length + 1;
            const docLength = (contentUpdateResponse.data.replies?.[0] as any)?.insertText?.endIndex ?? content.length + 1;

            const formattingRequests = this.generateFormattingRequests(format, docLength);

            if (formattingRequests.length > 0) {
                 await docs.documents.batchUpdate({
                    documentId: documentId,
                    requestBody: { requests: formattingRequests }
                });
            }

            return `successfully created Google Doc: ${title} (${format} format). Link: ${docLink}`;

        } catch (error) {
            console.error("Google Docs API Error:", error);
            return `error while writing into google doc file: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}