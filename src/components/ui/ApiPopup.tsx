// /src/components/api/ApiPopup.tsx
import React from 'react';

interface ApiPopupProps {
  baseURL: string;
  agentId: string;
  onClose: () => void;
}

const ApiPopup: React.FC<ApiPopupProps> = ({ baseURL, agentId, onClose }) => {
  const curlRequest = `curl -X POST \\
  '${baseURL}/api/agents/${agentId}/chat' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "agent_id": "${agentId}",
    "messages": [
      {
        "role": "user",
        "content": "Your message here"
      }
    ]
  }'`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">API Integration</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap font-mono text-sm">{curlRequest}</pre>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(curlRequest);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
};

export default ApiPopup;