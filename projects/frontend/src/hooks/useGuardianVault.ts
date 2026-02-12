/**
 * Custom hook for GuardianVault operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import type { Vault, VaultCreate, VaultUpdate, TransactionCheckResult } from '../types';
import { api } from '../services/api';

export function useGuardianVault() {
    const { activeAddress } = useWallet();
    const [vault, setVault] = useState<Vault | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load vault for the current connected address
     */
    const loadVault = useCallback(async () => {
        if (!activeAddress) {
            setVault(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await api.getVault(activeAddress);
            setVault(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load vault';
            setError(message);
            // Don't set vault to null on error - might be a temporary issue
        } finally {
            setLoading(false);
        }
    }, [activeAddress]);

    /**
     * Create a new vault
     */
    const createVault = useCallback(async (riskThreshold: number) => {
        if (!activeAddress) {
            throw new Error('No wallet connected');
        }

        setLoading(true);
        setError(null);

        try {
            const data: VaultCreate = {
                risk_threshold: riskThreshold,
                user_address: activeAddress,
            };

            const newVault = await api.createVault(data);
            setVault(newVault);
            return newVault;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create vault';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [activeAddress]);

    /**
     * Update vault settings
     */
    const updateVault = useCallback(async (updates: VaultUpdate) => {
        if (!activeAddress) {
            throw new Error('No wallet connected');
        }

        setLoading(true);
        setError(null);

        try {
            const updatedVault = await api.updateVault(activeAddress, updates);
            setVault(updatedVault);
            return updatedVault;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update vault';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [activeAddress]);

    /**
     * Check if a transaction is allowed
     */
    const checkTransaction = useCallback(async (actionType: string): Promise<TransactionCheckResult> => {
        if (!activeAddress) {
            throw new Error('No wallet connected');
        }

        setLoading(true);
        setError(null);

        try {
            const result = await api.checkTransaction(activeAddress, actionType);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to check transaction';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [activeAddress]);

    /**
     * Freeze the vault
     */
    const freezeVault = useCallback(async (reason?: string) => {
        if (!activeAddress) {
            throw new Error('No wallet connected');
        }

        setLoading(true);
        setError(null);

        try {
            const result = await api.freezeVault({
                user_address: activeAddress,
                reason,
            });

            // Reload vault to get updated state
            await loadVault();
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to freeze vault';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [activeAddress, loadVault]);

    /**
     * Unfreeze the vault
     */
    const unfreezeVault = useCallback(async () => {
        if (!activeAddress) {
            throw new Error('No wallet connected');
        }

        setLoading(true);
        setError(null);

        try {
            const result = await api.unfreezeVault({
                user_address: activeAddress,
            });

            // Reload vault to get updated state
            await loadVault();
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to unfreeze vault';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [activeAddress, loadVault]);

    // Load vault when address changes
    useEffect(() => {
        loadVault();
    }, [loadVault]);

    return {
        vault,
        loading,
        error,
        hasVault: !!vault,
        loadVault,
        createVault,
        updateVault,
        checkTransaction,
        freezeVault,
        unfreezeVault,
    };
}
