/**
 * API Service for ChainGuardian Backend
 * Handles all HTTP requests to the backend API
 */

import type {
    Vault,
    VaultCreate,
    VaultUpdate,
    TransactionData,
    RiskAnalysis,
    AuditLog,
    TransactionCheckResult,
    FreezeRequest,
    UnfreezeRequest,
    FreezeResponse,
    ModelInfo,
    HealthResponse,
} from '../types';

// Get API base URL from environment or default to localhost
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api';

/**
 * Helper function to make API requests
 */
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${API_PREFIX}${endpoint}`;

    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(error.detail || error.message || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred');
    }
}

// ============================================================================
// Health Check
// ============================================================================

export async function getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
        throw new Error('Health check failed');
    }
    return response.json();
}

// ============================================================================
// Risk Analysis Endpoints
// ============================================================================

/**
 * Analyze a transaction for risk
 */
export async function analyzeRisk(transaction: TransactionData): Promise<RiskAnalysis> {
    return request<RiskAnalysis>('/analysis/risk', {
        method: 'POST',
        body: JSON.stringify(transaction),
    });
}

/**
 * Batch analyze multiple transactions
 */
export async function batchAnalyze(transactions: TransactionData[]): Promise<{ results: RiskAnalysis[] }> {
    return request<{ results: RiskAnalysis[] }>('/analysis/batch', {
        method: 'POST',
        body: JSON.stringify({ transactions }),
    });
}

/**
 * Get AI model information
 */
export async function getModelInfo(): Promise<ModelInfo> {
    return request<ModelInfo>('/analysis/model-info');
}

// ============================================================================
// Vault Management Endpoints
// ============================================================================

/**
 * Create a new vault
 */
export async function createVault(data: VaultCreate): Promise<Vault> {
    return request<Vault>('/vault/create', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Get vault information for an address
 */
export async function getVault(address: string): Promise<Vault> {
    return request<Vault>(`/vault/${address}`);
}

/**
 * Update vault settings
 */
export async function updateVault(address: string, data: VaultUpdate): Promise<Vault> {
    return request<Vault>(`/vault/${address}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Freeze a vault
 */
export async function freezeVault(data: FreezeRequest): Promise<FreezeResponse> {
    return request<FreezeResponse>('/vault/freeze', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Unfreeze a vault
 */
export async function unfreezeVault(data: UnfreezeRequest): Promise<FreezeResponse> {
    return request<FreezeResponse>('/vault/unfreeze', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Check if a transaction is allowed
 */
export async function checkTransaction(
    userAddress: string,
    actionType: string
): Promise<TransactionCheckResult> {
    const params = new URLSearchParams({
        user_address: userAddress,
        action_type: actionType,
    });

    return request<TransactionCheckResult>(`/vault/check-transaction?${params}`);
}

// ============================================================================
// Audit Log Endpoints
// ============================================================================

/**
 * Get audit log for a user address
 */
export async function getAuditLog(
    address: string,
    limit: number = 10,
    offset: number = 0
): Promise<AuditLog> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    return request<AuditLog>(`/audit/${address}?${params}`);
}

/**
 * Get a specific on-chain audit entry
 */
export async function getOnchainAuditEntry(index: number): Promise<{
    index: number;
    user_address: string;
    risk_score: number;
    decision: string;
    timestamp: number;
}> {
    return request(`/audit/onchain/${index}`);
}

/**
 * Get total on-chain audit count
 */
export async function getOnchainAuditCount(): Promise<{ total: number }> {
    return request('/audit/onchain/count');
}

// ============================================================================
// Export API object for convenience
// ============================================================================

export const api = {
    // Health
    getHealth,

    // Risk Analysis
    analyzeRisk,
    batchAnalyze,
    getModelInfo,

    // Vault Management
    createVault,
    getVault,
    updateVault,
    freezeVault,
    unfreezeVault,
    checkTransaction,

    // Audit Logs
    getAuditLog,
    getOnchainAuditEntry,
    getOnchainAuditCount,
};

export default api;
