/**
 * Custom hook for AI risk analysis
 */

import { useState, useCallback } from 'react';
import type { TransactionData, RiskAnalysis, ModelInfo } from '../types';
import { api } from '../services/api';

export function useAIAnalysis() {
    const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

    /**
     * Analyze a transaction for risk
     */
    const analyzeRisk = useCallback(async (transaction: TransactionData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.analyzeRisk(transaction);
            setAnalysis(result);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to analyze risk';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Batch analyze multiple transactions
     */
    const batchAnalyze = useCallback(async (transactions: TransactionData[]) => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.batchAnalyze(transactions);
            return result.results;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to batch analyze';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Load AI model information
     */
    const loadModelInfo = useCallback(async () => {
        try {
            const info = await api.getModelInfo();
            setModelInfo(info);
            return info;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load model info';
            setError(message);
            throw err;
        }
    }, []);

    /**
     * Reset the analysis state
     */
    const reset = useCallback(() => {
        setAnalysis(null);
        setError(null);
    }, []);

    return {
        analysis,
        loading,
        error,
        modelInfo,
        analyzeRisk,
        batchAnalyze,
        loadModelInfo,
        reset,
    };
}
