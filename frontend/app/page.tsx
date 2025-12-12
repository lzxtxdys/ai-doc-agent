// 'use client';

// import { useState, useCallback } from 'react';
// import DocAgentUI from '@/components/DocAgentUI';

// export default function Home() {
//   const [docLink, setDocLink] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);

//   const handleTaskStart = useCallback(() => {
//     setDocLink(null);
//     setIsLoading(true);
//   }, []);

//   const handleTaskComplete = useCallback((link: string) => {
//     setDocLink(link);
//     setIsLoading(false);
//   }, []);

//   return (
//     <main className="min-h-screen bg-gray-50">
      
//       <header className="bg-white shadow-md p-4 border-b border-gray-200">
//         <h1 className="text-2xl font-bold text-gray-800">
//           AI intelligent doc Agent (Doc Writer Agent)
//         </h1>
//         <p className="text-sm text-gray-500 mt-1">
//           please input your essay requirment, Agent will take Claude 3 Haiku generate content and save a google doc。
//         </p>
//       </header>
      
//       <div className="flex h-[calc(100vh-80px)]"> 
        
//         <div className="w-1/3 p-6 border-r border-gray-200 bg-white overflow-y-auto">
//           <h2 className="text-xl font-semibold mb-4 text-gray-700">input mission and talk to agent</h2>
          
//           <DocAgentUI 
//             onTaskStart={handleTaskStart}
//             onTaskComplete={handleTaskComplete}
//           />
          
//         </div>
        
//         <div className="w-2/3 p-6 bg-gray-100 overflow-y-auto flex flex-col">
//           <h2 className="text-xl font-semibold mb-4 text-gray-700">preview of generated doc</h2>
          
//           <div className="flex-grow bg-white border border-gray-300 rounded-lg shadow-inner overflow-hidden relative">

//             {!docLink && !isLoading && (
//               <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
//                 <p className="text-gray-500 text-lg">
//                   please input your mission on the left and run agent
//                 </p>
//               </div>
//             )}

//             {isLoading && (
//               <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
//                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                  </svg>
//                  <p className="ml-4 text-blue-600 font-medium">Agent running</p>
//               </div>
//             )}
            
//             {docLink && (
//                 <iframe 
//                     src={docLink.replace('/edit', '/embed')} 
//                     title="Generated Google Doc Preview"
//                     className="w-full h-full border-0"
//                     allowFullScreen
//                 />
//             )}
            
//           </div>

//           {docLink && (
//             <p className="mt-3 text-sm text-gray-600">
//                 doc generated:
//                 <a 
//                     href={docLink} 
//                     target="_blank" 
//                     rel="noopener noreferrer"
//                     className="text-blue-600 hover:text-blue-800 underline ml-2"
//                 >
//                     click here to open the doc in a new window
//                 </a>
//             </p>
//           )}

//         </div>
//       </div>
      
//     </main>
//   );
// }


'use client';

import { useState, useCallback } from 'react';
import DocAgentUI from '@/components/DocAgentUI';

function toPreviewUrl(link: string) {
  if (!link) return '';
  if (link.includes('/preview')) return link;
  if (link.includes('/edit')) return link.replace('/edit', '/preview');
  if (link.includes('/view')) return link.replace('/view', '/preview');

  const m = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://docs.google.com/document/d/${m[1]}/preview`;
  return link;
}

export default function Home() {
  const [docLink, setDocLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleTaskStart = useCallback(() => {
    setDocLink(null);
    setIsLoading(true);
  }, []);

  const handleTaskComplete = useCallback((link: string) => {
    setDocLink(link);
    setIsLoading(false);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">AI intelligent doc Agent (Doc Writer Agent)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Input your request on the left. Agent generates content and saves a Google Doc in your Drive (OAuth).
        </p>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        <div className="w-1/3 p-6 border-r border-gray-200 bg-white overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">input mission and talk to agent</h2>
          <DocAgentUI onTaskStart={handleTaskStart} onTaskComplete={handleTaskComplete} />
        </div>

        <div className="w-2/3 p-6 bg-gray-100 overflow-y-auto flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">preview of generated doc</h2>

          <div className="flex-grow bg-white border border-gray-300 rounded-lg shadow-inner overflow-hidden relative">
            {!docLink && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                <p className="text-gray-500 text-lg">please input your mission on the left and run agent</p>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="ml-4 text-blue-600 font-medium">Agent running</p>
              </div>
            )}

            {docLink && (
              <iframe
                src={toPreviewUrl(docLink)}
                title="Generated Google Doc Preview"
                className="w-full h-full border-0"
                allowFullScreen
              />
            )}
          </div>

          {docLink && (
            <p className="mt-3 text-sm text-gray-600">
              doc generated:
              <a href={docLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2">
                click here to open the doc in a new window
              </a>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
