
// import React, { useState, FormEvent } from 'react';

// interface DocAgentUIProps {
//   onTaskStart: () => void;
//   onTaskComplete: (link: string) => void;
// }

// interface AgentState {
//   status: 'idle' | 'loading' | 'error' | 'success';
//   message: string;
// }

// const BACKEND_API_URL = 'http://localhost:3001/api/run-agent';

// export default function DocAgentUI({ onTaskStart, onTaskComplete }: DocAgentUIProps) {
//   const [prompt, setPrompt] = useState<string>('');
//   const [agentState, setAgentState] = useState<AgentState>({ status: 'idle', message: '等待输入任务...' });
//   const [history, setHistory] = useState<AgentState[]>([]);

// const getStatusClasses = (status: AgentState['status']) => {
//     switch (status) {
//       case 'loading':
//         return 'bg-blue-100 border-blue-400 text-blue-700';
//       case 'error':
//         return 'bg-red-100 border-red-400 text-red-700';
//       case 'success':
//         return 'bg-green-100 border-green-400 text-green-700';
//       case 'idle':
//       default:
//         return 'bg-gray-100 border-gray-300 text-gray-600';
//     }
//   };


// const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!prompt.trim()) return;
//     setAgentState({ status: 'loading', message: 'starting agent: generating content' });
//     onTaskStart();
    
//     setHistory(prev => [
//       { status: 'idle', message: `[user]: ${prompt.trim()}` }, 
//       ...prev,
//     ]);
    
//     setPrompt('');

//     try {
//       const response = await fetch(BACKEND_API_URL, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ prompt: prompt.trim() }),
//       });

//       const data = await response.json();

//       if (!response.ok || !data.success) {
//         throw new Error(data.error || 'Agent API return failure。');
//       }

//       const resultText = data.result as string;

//       if (resultText.startsWith('🚨 Document Creation Failed:')) {
//         const errorMessage = resultText.replace('🚨 Document Creation Failed: ', '');
        
//         setAgentState({ 
//             status: 'error', 
//             message: `❌ 任务失败: Google Docs 工具报告错误。原因: ${errorMessage}` 
//         });

//         setHistory(prev => [
//           { status: 'error', message: `[Agent]: ❌ 工具执行失败。原因: ${errorMessage}` },
//           ...prev.slice(1) 
//         ]);
//         return; // 立即返回，不进行链接解析
//       }
      
//       const urlRegex = /(https:\/\/docs\.google\.com\/document\/d\/[^/]+\/edit\?usp=drivesdk)/; 
      
//       const linkMatch = resultText.match(urlRegex);
//         //const linkMatch = resultText.match(/Link: (https:\/\/docs\.google\.com\/document\/[^/]+\/edit\?usp=drivesdk)/);
//         const docLink = linkMatch ? linkMatch[1] : '';

//       const agentResponseEntry = { status: 'success', message: `[Agent原始文本]: ${resultText.trim()}` };
      
//       if (docLink) {
//         setAgentState({ status: 'success', message: 'mission complete, google doc is created and saved to google drive' });
//         onTaskComplete(docLink);
//         const linkSuccessEntry = { status: 'success', message: `the google doc link has successfully been parsed: ${docLink}` };
        
//         setHistory(prev => [
//             { status: 'success', message: `[Agent]: ${resultText}` }, 
//             ...prev.slice(1) 
//         ]);
        
//         onTaskComplete(docLink);
        
//       } else {
//         const failureMessage = `mission complete, but failed to parse the doc link from the response, please check [Agent original text] to get the link`;
//         setAgentState({ status: 'error', message: `mission complete, but failed to parse the doc link from the response, please check [Agent original text] to get the link` });

//         setHistory(prev => [
//             { status: 'error', message: `[Agent]: ${failureMessage}` },
//             { status: 'idle', message: `[original text]: ${resultText}` },
//             ...prev.slice(1)
//         ]);

//       }
      

//     } catch (error: any) {
//       const errorMessage = `mission fail: ${error.message}`;
//       setAgentState({ status: 'error', message: errorMessage });
//       setHistory(prev => [
//         { status: 'error', message: `[Agent]: ${errorMessage}` },
//         ...prev.slice(1)
//       ]);
//       console.error('API Call Error:', error);
//     }
//   };

// return (
//     <div className="flex flex-col h-full">
//       <div className="flex-grow p-4 space-y-3 bg-gray-50 border border-gray-200 rounded-lg overflow-y-auto mb-4 h-[50vh]">
        
//         {history.map((item, index) => (
//           <div key={index} className={`p-3 rounded-lg text-sm ${getStatusClasses(item.status)}`}>
//             {item.message}
//           </div>
//         ))}

//         <div className={`p-3 rounded-lg text-sm font-medium ${getStatusClasses(agentState.status)}`}>
//           {agentState.status === 'loading' && (
//              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//              </svg>
//           )}
//           {agentState.message}
//         </div>
//       </div>

//       <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
//         <textarea
//           value={prompt}
//           onChange={(e) => setPrompt(e.target.value)}
//           rows={5}
//           className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-y text-black"
//           placeholder="example: 'please write an essay about chinese history, 1000 words, in MLA format'"
//           disabled={agentState.status === 'loading'}
//         />
//         <button
//           type="submit"
//           className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition duration-150"
//           disabled={!prompt.trim() || agentState.status === 'loading'}
//         >
//           {agentState.status === 'loading' ? 'Agent running...' : 'start agent mission'}
//         </button>
//       </form>
//     </div>
//   );
// }

import React, { useState, FormEvent } from 'react';

interface DocAgentUIProps {
  onTaskStart: () => void;
  onTaskComplete: (link: string) => void;
}

interface AgentState {
  status: 'idle' | 'loading' | 'error' | 'success';
  message: string;
}

const BACKEND_API_URL = 'http://localhost:3001/api/run-agent';

export default function DocAgentUI({ onTaskStart, onTaskComplete }: DocAgentUIProps) {
  const [prompt, setPrompt] = useState<string>('');
  const [agentState, setAgentState] = useState<AgentState>({ status: 'idle', message: '等待输入任务...' });
  const [history, setHistory] = useState<AgentState[]>([]);

  const getStatusClasses = (status: AgentState['status']) => {
    switch (status) {
      case 'loading':
        return 'bg-blue-100 border-blue-400 text-blue-700';
      case 'error':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'success':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'idle':
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const parseDocLink = (text: string) => {
    const regex = /(https?:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9-_]+(?:\/[^\s]*)?)/;
    const m = text.match(regex);
    return m ? m[1] : '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const p = prompt.trim();
    if (!p) return;

    setAgentState({ status: 'loading', message: 'Agent running: generating + writing Google Doc...' });
    onTaskStart();

    setHistory(prev => [{ status: 'idle', message: `[user]: ${p}` }, ...prev]);
    setPrompt('');

    try {
      const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errMsg = data?.error || 'Agent API returned failure';
        setAgentState({ status: 'error', message: `❌ 任务失败: ${errMsg}` });
        setHistory(prev => [{ status: 'error', message: `[Agent]: ❌ ${errMsg}` }, ...prev]);
        return;
      }

      const resultText = (data.result as string) || '';
      const docLink = (data.link as string) || parseDocLink(resultText);

      setHistory(prev => [{ status: 'success', message: `[Agent]: ${resultText}` }, ...prev]);

      if (docLink) {
        setAgentState({ status: 'success', message: '✅ mission complete: Google Doc created' });
        onTaskComplete(docLink);
      } else {
        setAgentState({ status: 'error', message: 'mission complete but no doc link returned' });
        setHistory(prev => [{ status: 'error', message: `[Agent]: 未拿到 doc link` }, ...prev]);
      }
    } catch (error: any) {
      const errorMessage = `mission fail: ${error?.message || String(error)}`;
      setAgentState({ status: 'error', message: errorMessage });
      setHistory(prev => [{ status: 'error', message: `[Agent]: ${errorMessage}` }, ...prev]);
      console.error('API Call Error:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-4 space-y-3 bg-gray-50 border border-gray-200 rounded-lg overflow-y-auto mb-4 h-[50vh]">
        {history.map((item, index) => (
          <div key={index} className={`p-3 rounded-lg text-sm ${getStatusClasses(item.status)}`}>
            {item.message}
          </div>
        ))}

        <div className={`p-3 rounded-lg text-sm font-medium ${getStatusClasses(agentState.status)}`}>
          {agentState.status === 'loading' && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {agentState.message}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-y text-black"
          placeholder="example: 'write an essay about ..., 1000 words, MLA format'"
          disabled={agentState.status === 'loading'}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition duration-150"
          disabled={!prompt.trim() || agentState.status === 'loading'}
        >
          {agentState.status === 'loading' ? 'Agent running...' : 'start agent mission'}
        </button>
      </form>
    </div>
  );
}
