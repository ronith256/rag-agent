import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Evaluation } from '../../types/types';

interface EvaluationDetailsProps {
  evaluation: Evaluation;
}

export const EvaluationDetails: React.FC<EvaluationDetailsProps> = ({ evaluation }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (evaluation.status === 'processing') {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  Processing evaluation
                </span>
                <span className="text-sm text-gray-500">
                  Started {formatDate(evaluation.timestamp)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (evaluation.status === 'failed') {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4 text-red-600">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  Evaluation Failed
                </span>
                <span className="text-sm">
                  {formatDate(evaluation.timestamp)}
                </span>
              </div>
              {evaluation.error && (
                <p className="text-sm mt-2">{evaluation.error}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Evaluation Results - {formatDate(evaluation.timestamp)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium mb-2">Aggregate Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Mean Similarity:</span>
                <span className={`font-medium ${
                  evaluation.aggregate_metrics.mean_similarity >= 0.7 
                    ? 'text-green-600' 
                    : evaluation.aggregate_metrics.mean_similarity >= 0.5 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  {formatPercentage(evaluation.aggregate_metrics.mean_similarity)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Median Similarity:</span>
                <span className="font-medium">
                  {formatPercentage(evaluation.aggregate_metrics.median_similarity)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min Similarity:</span>
                <span className="font-medium text-red-600">
                  {formatPercentage(evaluation.aggregate_metrics.min_similarity)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Max Similarity:</span>
                <span className="font-medium text-green-600">
                  {formatPercentage(evaluation.aggregate_metrics.max_similarity)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Standard Deviation:</span>
                <span className="font-medium">
                  {formatPercentage(evaluation.aggregate_metrics.std_similarity)}
                </span>
              </div>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={evaluation.results.map((result, index) => ({
                  index: index + 1,
                  similarity: result.similarity_score
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="index" 
                  label={{ value: 'Question Number', position: 'bottom' }}
                />
                <YAxis 
                  domain={[0, 1]} 
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  label={{ 
                    value: 'Similarity Score', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Similarity']}
                  labelFormatter={(label) => `Question ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="similarity"
                  stroke="#4f46e5"
                  name="Similarity Score"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-4">Detailed Results</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {evaluation.results.map((result, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-700">
                      Question {index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      result.similarity_score >= 0.7
                        ? 'bg-green-100 text-green-800'
                        : result.similarity_score >= 0.5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formatPercentage(result.similarity_score)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Question:</p>
                      <p className="mt-1">{result.question}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Original Answer:</p>
                        <p className="mt-1 text-sm">{result.original_answer}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Generated Answer:</p>
                        <p className="mt-1 text-sm">{result.generated_answer}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};