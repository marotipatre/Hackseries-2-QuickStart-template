/**
 * Custom hook for audit log operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import type { AuditLog, AuditEntry } from '../types';
import { api } from '../services/api';

export function useAuditLog() {
    const { activeAddress } = useWallet();
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load audit log for the current connected address
     */
    const loadAuditLog = useCallback(async (limit: number = 10, offset: number = 0) => {
        if (!activeAddress) {
            setEntries([]);
            setTotal(0);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await api.getAuditLog(activeAddress, limit, offset);
            setEntries(data.entries);
            setTotal(data.total);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load audit log';
            setError(message);
            setEntries([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [activeAddress]);

    /**
     * Get a specific on-chain audit entry
     */
    const getOnchainEntry = useCallback(async (index: number) => {
        setLoading(true);
        setError(null);

        try {
            const entry = await api.getOnchainAuditEntry(index);
            return entry;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to get audit entry';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get total on-chain audit count
     */
    const getOnchainCount = useCallback(async () => {
        try {
            const result = await api.getOnchainAuditCount();
            return result.total;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to get audit count';
            setError(message);
            throw err;
        }
    }, []);

    /**
     * Get decision label from code
     */
    const getDecisionLabel = useCallback((code: number): string => {
        switch (code) {
            case 0: return 'BLOCKED';
            case 1: return 'ALLOWED';
            case 2: return 'FROZEN';
            default: return 'UNKNOWN';
        }
    }, []);

    /**
     * Get decision color class
     */
    const getDecisionColor = useCallback((code: number): string => {
        switch (code) {
            case 0: return 'text-red-500';
            case 1: return 'text-green-500';
            case 2: return 'text-orange-500';
            default: return 'text-gray-500';
        }
    }, []);

    // Load audit log when address changes
    useEffect(() => {
        loadAuditLog();
    }, [loadAuditLog]);

    return {
        entries,
        total,
        loading,
        error,
        loadAuditLog,
        getOnchainEntry,
        getOnchainCount,
        getDecisionLabel,
        getDecisionColor,
    };
}
