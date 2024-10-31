import React, { useState } from 'react';
import { Bot, Code, Send } from 'lucide-react';
import { Agent, Message } from '@/types/types';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface ChatInterfaceProps {
  selectedAgent: Agent;
  baseURL: string;
  getModelDisplayName: (agent: Agent) => string;
  setShowApiPopup: (show: boolean) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedAgent,
  baseURL,
  getModelDisplayName,
  setShowApiPopup,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    try {
      const response = await axios.post(`${baseURL}/api/agents/${selectedAgent.id}/chat`, {
        agent_id: selectedAgent.id,
        messages: [...messages, newMessage]
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Error: Failed to send message. Please try again.'
      }]);
    }
  };

  // Enhanced markdown components with better styling
  const MarkdownComponents = {
    // Code blocks with syntax highlighting
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="my-4">
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="rounded-lg overflow-hidden"
            showLineNumbers
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
    // Regular text paragraphs
    p({ children }: any) {
      return <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>;
    },
    // Headers
    h1({ children }: any) {
      return <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>;
    },
    // Lists
    ul({ children }: any) {
      return <ul className="list-disc ml-6 mb-4 space-y-1">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal ml-6 mb-4 space-y-1">{children}</ol>;
    },
    li({ children }: any) {
      return <li className="leading-relaxed">{children}</li>;
    },
    // Blockquotes
    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-4 border-gray-200 pl-4 my-4 italic text-gray-700">
          {children}
        </blockquote>
      );
    },
    // Tables
    table({ children }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-gray-200 rounded-lg">
            {children}
          </table>
        </div>
      );
    },
    th({ children }: any) {
      return <th className="border border-gray-200 px-4 py-2 bg-gray-50 font-semibold">{children}</th>;
    },
    td({ children }: any) {
      return <td className="border border-gray-200 px-4 py-2">{children}</td>;
    },
    // Links
    a({ children, href }: any) {
      return (
        <a 
          href={href}
          className="text-blue-600 hover:text-blue-800 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
    // Horizontal rules
    hr() {
      return <hr className="my-6 border-t border-gray-200" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="font-medium">{selectedAgent.config.collection}</h2>
              <p className="text-sm text-gray-500">{getModelDisplayName(selectedAgent)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowApiPopup(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Code className="w-4 h-4" />
            Get API
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-800 shadow-sm'
              }`}
            >
              {message.role === 'user' ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <ReactMarkdown
                  components={MarkdownComponents}
                  className="prose prose-sm max-w-none dark:prose-invert"
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={!inputMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;