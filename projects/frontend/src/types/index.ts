/**
 * Type definitions for ChainGuardian frontend
 */

// ============================================================================
// Vault Types
// ============================================================================

export interface Vault {
    user_address: string;
    risk_threshold: number;
    current_risk_score: number;
    is_frozen: boolean;
    created_at?: string;
}

export interface VaultCreate {
    risk_threshold: number;
    user_address: string;
}

export interface VaultUpdate {
    risk_threshold?: number;
}

// ============================================================================
// Risk Analysis Types
// ============================================================================

export interface TransactionData {
    type: string;
    amount: number;
    sender: string;
    recipient: string;
    timestamp?: string;
    protocol?: string;
    additional_context?: Record<string, unknown>;
}

export interface RiskAnalysis {
    risk_score: number;
    recommendation: 'ALLOW' | 'WARN' | 'BLOCK';
    reasoning: string;
    model_used: string;
    confidence: number;
}

export type Recommendation = 'ALLOW' | 'WARN' | 'BLOCK';

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditEntry {
    id: number;
    user_address: string;
    risk_score: number;
    decision: number; // 0=BLOCKED, 1=ALLOWED, 2=FROZEN
    timestamp: number;
}

export interface AuditLog {
    entries: AuditEntry[];
    total: number;
}

export type Decision = 'BLOCKED' | 'ALLOWED' | 'FROZEN';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface HealthResponse {
    status: string;
    version: string;
    service: string;
    network: string;
}

// ============================================================================
// Transaction Check Types
// ============================================================================

export interface TransactionCheckResult {
    allowed: boolean;
    reason?: string;
    risk_score?: number;
    threshold?: number;
}

// ============================================================================
// Freeze/Unfreeze Types
// ============================================================================

export interface FreezeRequest {
    user_address: string;
    reason?: string;
}

export interface UnfreezeRequest {
    user_address: string;
}

export interface FreezeResponse {
    success: boolean;
    message: string;
    reason?: string;
}

// ============================================================================
// Model Info Types
// ============================================================================

export interface ModelInfo {
    model: string;
    provider: string;
    api_base: string;
    configured: boolean;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface VaultState {
    vault: Vault | null;
    loading: boolean;
    error: string | null;
}

export interface AnalysisState {
    analysis: RiskAnalysis | null;
    loading: boolean;
    error: string | null;
}

export interface AuditState {
    entries: AuditEntry[];
    total: number;
    loading: boolean;
    error: string | null;
}

// ============================================================================
// Risk Level Helper Types
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export function getRiskLevel(score: number): RiskLevel {
    if (score <= 30) return 'low';
    if (score <= 60) return 'medium';
    if (score <= 80) return 'high';
    return 'critical';
}

export function getRiskColor(level: RiskLevel): string {
    switch (level) {
        case 'low': return 'text-green-500';
        case 'medium': return 'text-yellow-500';
        case 'high': return 'text-orange-500';
        case 'critical': return 'text-red-500';
    }
}

export function getRiskBgColor(level: RiskLevel): string {
    switch (level) {
        case 'low': return 'bg-green-500';
        case 'medium': return 'bg-yellow-500';
        case 'high': return 'bg-orange-500';
        case 'critical': return 'bg-red-500';
    }
}
