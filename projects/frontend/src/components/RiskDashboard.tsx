/**
 * Risk Dashboard Component
 * Displays vault status, risk score, and quick actions
 */

import { useWallet } from '@txnlab/use-wallet-react';
import { useGuardianVault } from '../hooks/useGuardianVault';
import { getRiskLevel, getRiskColor, getRiskBgColor, type RiskLevel } from '../types';

export function RiskDashboard() {
    const { activeAddress } = useWallet();
    const {
        vault,
        loading,
        error,
        hasVault,
        freezeVault,
        unfreezeVault,
    } = useGuardianVault();

    if (!activeAddress) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Risk Dashboard</h2>
                    <p className="text-gray-500">Please connect your wallet to view your vault status.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Risk Dashboard</h2>
                    <div className="flex items-center justify-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Risk Dashboard</h2>
                    <div className="alert alert-error">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!hasVault) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Risk Dashboard</h2>
                    <p className="text-gray-500">No vault found. Create a vault to start using ChainGuardian.</p>
                </div>
            </div>
        );
    }

    const riskLevel: RiskLevel = getRiskLevel(vault.current_risk_score);
    const riskColor = getRiskColor(riskLevel);
    const riskBgColor = getRiskBgColor(riskLevel);

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Risk Dashboard
                </h2>

                {/* Vault Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Risk Score Card */}
                    <div className="stat bg-base-200 rounded-lg">
                        <div className="stat-title">Risk Score</div>
                        <div className={`stat-value ${riskColor}`}>
                            {vault.current_risk_score}
                        </div>
                        <div className="stat-desc">
                            <span className={`badge ${riskBgColor} text-white`}>
                                {riskLevel.toUpperCase()} RISK
                            </span>
                        </div>
                    </div>

                    {/* Threshold Card */}
                    <div className="stat bg-base-200 rounded-lg">
                        <div className="stat-title">Risk Threshold</div>
                        <div className="stat-value text-primary">
                            {vault.risk_threshold}
                        </div>
                        <div className="stat-desc">
                            Transactions above this will be blocked
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="stat bg-base-200 rounded-lg">
                        <div className="stat-title">Vault Status</div>
                        <div className={`stat-value ${vault.is_frozen ? 'text-red-500' : 'text-green-500'}`}>
                            {vault.is_frozen ? 'FROZEN' : 'ACTIVE'}
                        </div>
                        <div className="stat-desc">
                            {vault.is_frozen ? 'All transactions blocked' : 'Normal operation'}
                        </div>
                    </div>
                </div>

                {/* Risk Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Risk Level</span>
                        <span className={`text-sm font-medium ${riskColor}`}>
                            {vault.current_risk_score} / 100
                        </span>
                    </div>
                    <progress
                        className="progress w-full"
                        value={vault.current_risk_score}
                        max="100"
                    ></progress>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>Safe</span>
                        <span>Moderate</span>
                        <span>High</span>
                        <span>Critical</span>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card-actions justify-end mt-6">
                    {vault.is_frozen ? (
                        <button
                            className="btn btn-success"
                            onClick={() => unfreezeVault()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            Unfreeze Vault
                        </button>
                    ) : (
                        <button
                            className="btn btn-warning"
                            onClick={() => freezeVault('Emergency freeze')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Freeze Vault
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
