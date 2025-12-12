// import { google } from "googleapis"; 
// // 在这里我想使用@corespeed/zypher，但是由于我想用他的tool&toolArgument，路径始终显示错误，我mock一下，使用anthropic

// import { GoogleAuth } from 'google-auth-library';
// import * as path from 'path';
// // xin

// interface ToolArguments {}

// abstract class Tool<T extends ToolArguments> {

//     public abstract readonly name: string;
//     public abstract readonly description: string;
//     public abstract readonly args: Record<string, any>;

//     public abstract execute(args: T): Promise<string>;
// }

// export interface WriteDocArgs extends ToolArguments {
//     title: string;
//     content: string;
//     format: "MLA" | "APA" | "General";
// }

// export class GoogleDocsWriterTool extends Tool<WriteDocArgs> {
//     public readonly name = "google_docs_writer";
//     public readonly description = "Creates a new Google Document with a given title, content, and applies basic formatting (like MLA or APA) using the Google Docs API. Returns the URL of the newly created document.";

//     public readonly args = {
//         title: {
//             type: "string",
//             description: "The title for the new Google Document (e.g., 'Black Lives Matter Essay').",
//         },
//         content: {
//             type: "string",
//             description: "The complete, generated body text of the document to be inserted.",
//         },
//         format: {
//             type: "string",
//             description: "The required academic format for the document ('MLA', 'APA', or 'General').",
//         }
//     };

//     // private async getAuthorizedClient() {
//     //     const clientId = process.env.GCP_CLIENT_ID;
//     //     const clientSecret = process.env.GCP_CLIENT_SECRET;
//     //     const refreshToken = process.env.GCP_REFRESH_TOKEN;

//     //     if (!clientId || !clientSecret || !refreshToken) {
//     //         throw new Error("Missing GCP_CLIENT_ID, GCP_CLIENT_SECRET, or GCP_REFRESH_TOKEN environment variables. Cannot authenticate Google Docs API.");
//     //     }

//     //     const oAuth2Client = new google.auth.OAuth2(
//     //         clientId,
//     //         clientSecret,
//     //         'urn:ietf:wg:oauth:2.0:oob' 
//     //     );

//     //     oAuth2Client.setCredentials({
//     //         refresh_token: refreshToken,
//     //     });
        
//     //     return oAuth2Client;
//     // }
//     // xin

//     private docs: any;
//     private drive: any;

//     constructor() {
//         super();

//         const KEYFILE_PATH = path.join(__dirname, 'service_account.json');

//         const SCOPES = [
//             'https://www.googleapis.com/auth/documents', // 读写 Docs
//             'https://www.googleapis.com/auth/drive'      // 读写 Drive
//         ];

//         const authClient = new GoogleAuth({
//             keyFile: KEYFILE_PATH,
//             scopes: SCOPES,
//         });

//         this.docs = google.docs({ version: 'v1', auth: authClient });
//         this.drive = google.drive({ version: 'v3', auth: authClient });
        
//         console.log('[GoogleDocsTool] Service Account client initialized.');
//     }
    


//     private generateFormattingRequests(format: WriteDocArgs['format'], docLength: number): any[] {
//         const requests: any[] = [];

//         const entireDocumentRange = { startIndex: 1, endIndex: docLength };
    
//         const baseFormattingRequests: any[] = [
//             {
//                 updateParagraphStyle: {
//                     paragraphStyle: { lineSpacing: 200 },
//                     fields: "lineSpacing",
//                     range: entireDocumentRange
//                 }
//             },
//             {
//                 updateTextStyle: {
//                     textStyle: {
//                         fontSize: { magnitude: 12, unit: 'PT' },
//                     },
//                     fields: "fontSize",
//                     range: entireDocumentRange
//                 }
//             }
//         ];
    
//         if (format === "MLA" || format === "APA" || format === "General") {
//              requests.push(...baseFormattingRequests);
//         }
        
//         return requests;
//     }

//     public async execute(args: WriteDocArgs): Promise<string> {
//         const { title, content, format } = args;

//         try {
//             // const authClient = await this.getAuthorizedClient();
//             // const docs = google.docs({ version: 'v1', auth: authClient });
//             // const drive = google.drive({ version: 'v3', auth: authClient });
//             // xin
//             const docs = this.docs; 
//             const drive = this.drive;
            
//             const createResponse = await drive.files.create({
//                 requestBody: {
//                     name: title,
//                     mimeType: 'application/vnd.google-apps.document',
//                 },
//                 fields: 'id,webViewLink',
//             });

//             const documentId = createResponse.data.id;
//             const docLink = createResponse.data.webViewLink;

//             if (!documentId || !docLink) {
//                 return `Error: Failed to create Google Doc titled ${title}.`;
//             }
            
//             const insertRequests = [{
//                 insertText: {
//                     text: content,
//                     endOfSegmentLocation: {} 
//                 }
//             }];

//             const contentUpdateResponse = await docs.documents.batchUpdate({
//                 documentId: documentId,
//                 requestBody: { requests: insertRequests }
//             });

//             // const docLength = contentUpdateResponse.data.replies?.[0]?.insertText?.['endIndex'] ?? content.length + 1;
//             const docLength = (contentUpdateResponse.data.replies?.[0] as any)?.insertText?.endIndex ?? content.length + 1;

//             const formattingRequests = this.generateFormattingRequests(format, docLength);

//             if (formattingRequests.length > 0) {
//                  await docs.documents.batchUpdate({
//                     documentId: documentId,
//                     requestBody: { requests: formattingRequests }
//                 });
//             }

//             return `successfully created Google Doc: ${title} (${format} format). ***FINAL_LINK***: ${docLink}`;

//         } catch (error) {
//             console.error("Google Docs API Error:", error);
//             return `error while writing into google doc file: ${error instanceof Error ? error.message : String(error)}`;
//         }
//     }
// }

// googleDocsTool.ts
import { google } from 'googleapis';

export interface WriteDocArgs {
  title: string;
  content: string;
  folderId?: string; // optional: Drive folder to place the doc in
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is not set`);
  return value;
}

export function createOAuthClient() {
  const clientId = getRequiredEnv('GCP_CLIENT_ID');
  const clientSecret = getRequiredEnv('GCP_CLIENT_SECRET');
  const refreshToken = getRequiredEnv('GCP_REFRESH_TOKEN');

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3001/oauth2/callback'
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export class GoogleDocsWriterTool {
  private drive;
  private docs;

  constructor(private oauth2Client: any) {
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
    this.docs = google.docs({ version: 'v1', auth: oauth2Client });
  }

  async writeDoc(args: WriteDocArgs): Promise<{ success: boolean; id?: string; link?: string; message?: string }> {
    try {
      // 1) Create document file in Drive
      const createRes = await this.drive.files.create({
        requestBody: {
          name: args.title,
          mimeType: 'application/vnd.google-apps.document',
          ...(args.folderId ? { parents: [args.folderId] } : {}),
        },
        fields: 'id, webViewLink',
      });

    //   const fileId: string | undefined = createRes.data.id;
    //   const webViewLink: string | undefined = createRes.data.webViewLink;
        const fileId = createRes.data.id ?? undefined;
        const webViewLink = createRes.data.webViewLink ?? undefined;

      if (!fileId) return { success: false, message: 'Drive did not return a file id.' };

      // 2) Insert text content
      const requests: any[] = [];
      if (args.content?.length) {
        requests.push({
          insertText: {
            location: { index: 1 },
            text: args.content,
          },
        });
      }

      if (requests.length) {
        await this.docs.documents.batchUpdate({
          documentId: fileId,
          requestBody: { requests },
        });
      }

      return {
        success: true,
        id: fileId,
        link: webViewLink ?? `https://docs.google.com/document/d/${fileId}/edit`,
      };
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? String(err);
      return { success: false, message: msg };
    }
  }
}
