/**
 * AI Analysis Panel Component
 * Allows users to analyze transactions using AI
 */

import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import type { TransactionData } from '../types';

export function AIAnalysisPanel() {
    const { activeAddress } = useWallet();
    const { analyzeRisk, analysis, loading, error, reset } = useAIAnalysis();

    const [transactionType, setTransactionType] = useState('transfer');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [protocol, setProtocol] = useState('');

    const handleAnalyze = async () => {
        if (!activeAddress) {
            alert('Please connect your wallet first');
            return;
        }

        if (!amount || !recipient) {
            alert('Please fill in all required fields');
            return;
        }

        const transactionData: TransactionData = {
            type: transactionType,
            amount: parseFloat(amount),
            sender: activeAddress,
            recipient,
            timestamp: new Date().toISOString(),
            protocol: protocol || undefined,
        };

        try {
            await analyzeRisk(transactionData);
        } catch (err) {
            console.error('Analysis failed:', err);
        }
    };

    const handleReset = () => {
        reset();
        setAmount('');
        setRecipient('');
        setProtocol('');
    };

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'ALLOW': return 'text-green-500';
            case 'WARN': return 'text-yellow-500';
            case 'BLOCK': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getRecommendationBadge = (rec: string) => {
        switch (rec) {
            case 'ALLOW': return 'badge-success';
            case 'WARN': return 'badge-warning';
            case 'BLOCK': return 'badge-error';
            default: return 'badge-neutral';
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Risk Analysis
                </h2>

                {!activeAddress && (
                    <div className="alert alert-info">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Connect your wallet to analyze transactions</span>
                    </div>
                )}

                {/* Input Form */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Transaction Type</span>
                    </label>
                    <select
                        className="select select-bordered w-full"
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value)}
                        disabled={!activeAddress || loading}
                    >
                        <option value="transfer">Transfer</option>
                        <option value="swap">Swap</option>
                        <option value="stake">Stake</option>
                        <option value="unstake">Unstake</option>
                        <option value="claim">Claim Rewards</option>
                        <option value="approve">Approve</option>
                    </select>
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Amount (ALGO)</span>
                    </label>
                    <input
                        type="number"
                        placeholder="Enter amount"
                        className="input input-bordered"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={!activeAddress || loading}
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Recipient Address</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Enter recipient address"
                        className="input input-bordered"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        disabled={!activeAddress || loading}
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Protocol (Optional)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., Tinyman, Pact, etc."
                        className="input input-bordered"
                        value={protocol}
                        onChange={(e) => setProtocol(e.target.value)}
                        disabled={!activeAddress || loading}
                    />
                </div>

                {/* Action Buttons */}
                <div className="card-actions justify-end mt-4">
                    <button
                        className="btn btn-ghost"
                        onClick={handleReset}
                        disabled={loading}
                    >
                        Reset
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleAnalyze}
                        disabled={!activeAddress || loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner"></span>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Analyze Risk
                            </>
                        )}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="alert alert-error mt-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Analysis Results */}
                {analysis && (
                    <div className="mt-6 space-y-4">
                        <div className="divider">Analysis Results</div>

                        {/* Risk Score */}
                        <div className="stat bg-base-200 rounded-lg">
                            <div className="stat-title">Risk Score</div>
                            <div className={`stat-value ${getRecommendationColor(analysis.recommendation)}`}>
                                {analysis.risk_score}
                            </div>
                            <div className="stat-desc">
                                <span className={`badge ${getRecommendationBadge(analysis.recommendation)}`}>
                                    {analysis.recommendation}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">Risk Level</span>
                                <span className={`text-sm font-medium ${getRecommendationColor(analysis.recommendation)}`}>
                                    {analysis.risk_score} / 100
                                </span>
                            </div>
                            <progress
                                className="progress w-full"
                                value={analysis.risk_score}
                                max="100"
                            ></progress>
                        </div>

                        {/* Reasoning */}
                        <div className="alert">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="font-bold">AI Reasoning</h3>
                                <div className="text-sm">{analysis.reasoning}</div>
                            </div>
                        </div>

                        {/* Model Info */}
                        <div className="text-xs text-gray-500">
                            <p>Model: {analysis.model_used}</p>
                            <p>Confidence: {(analysis.confidence * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
