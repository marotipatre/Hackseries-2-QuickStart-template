/**
 * GuardianVault Component
 * Allows users to create and manage their vaults
 */

import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { useGuardianVault } from '../hooks/useGuardianVault';

export function GuardianVault() {
    const { activeAddress } = useWallet();
    const { hasVault, createVault, updateVault, vault, loading } = useGuardianVault();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [riskThreshold, setRiskThreshold] = useState(70);

    const handleCreateVault = async () => {
        if (!activeAddress) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            await createVault(riskThreshold);
            setShowCreateForm(false);
            alert('Vault created successfully!');
        } catch (err) {
            alert(`Failed to create vault: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleUpdateVault = async () => {
        if (!activeAddress) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            await updateVault({ risk_threshold: riskThreshold });
            setShowUpdateForm(false);
            alert('Vault updated successfully!');
        } catch (err) {
            alert(`Failed to update vault: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    if (!activeAddress) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Guardian Vault</h2>
                    <p className="text-gray-500">Please connect your wallet to create a vault.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Guardian Vault
                </h2>

                {!hasVault ? (
                    <>
                        <p className="text-gray-600">
                            Create a Guardian Vault to protect your DeFi transactions with AI-powered risk analysis.
                        </p>

                        {!showCreateForm ? (
                            <div className="card-actions justify-end">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowCreateForm(true)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Vault
                                </button>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Risk Threshold (0-100)</span>
                                        <span className="label-text-alt">
                                            Transactions with risk score above this will be blocked
                                        </span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={riskThreshold}
                                        onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
                                        className="range range-primary"
                                    />
                                    <div className="w-full flex justify-between text-xs px-2">
                                        <span>0</span>
                                        <span>25</span>
                                        <span>50</span>
                                        <span>75</span>
                                        <span>100</span>
                                    </div>
                                    <div className="text-center mt-2">
                                        <span className="text-2xl font-bold text-primary">
                                            {riskThreshold}
                                        </span>
                                    </div>
                                </div>

                                <div className="card-actions justify-end gap-2">
                                    <button
                                        className="btn btn-ghost"
                                        onClick={() => setShowCreateForm(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleCreateVault}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="loading loading-spinner"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Vault'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="alert alert-success">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Your vault is active and protecting your transactions!</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="stat bg-base-200 rounded-lg">
                                <div className="stat-title">Vault Address</div>
                                <div className="stat-value text-xs">
                                    {vault?.user_address.slice(0, 8)}...{vault?.user_address.slice(-8)}
                                </div>
                            </div>

                            <div className="stat bg-base-200 rounded-lg">
                                <div className="stat-title">Current Threshold</div>
                                <div className="stat-value text-primary">
                                    {vault?.risk_threshold}
                                </div>
                            </div>
                        </div>

                        {!showUpdateForm ? (
                            <div className="card-actions justify-end mt-4">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setRiskThreshold(vault?.risk_threshold || 70);
                                        setShowUpdateForm(true);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Update Threshold
                                </button>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">New Risk Threshold (0-100)</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={riskThreshold}
                                        onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
                                        className="range range-primary"
                                    />
                                    <div className="text-center mt-2">
                                        <span className="text-2xl font-bold text-primary">
                                            {riskThreshold}
                                        </span>
                                    </div>
                                </div>

                                <div className="card-actions justify-end gap-2">
                                    <button
                                        className="btn btn-ghost"
                                        onClick={() => setShowUpdateForm(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleUpdateVault}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="loading loading-spinner"></span>
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Vault'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
