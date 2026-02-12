/**
 * Audit Log Component
 * Displays the audit log for the user's vault
 */

import { useWallet } from '@txnlab/use-wallet-react';
import { useAuditLog } from '../hooks/useAuditLog';

export function AuditLog() {
    const { activeAddress } = useWallet();
    const {
        entries,
        total,
        loading,
        error,
        loadAuditLog,
        getDecisionLabel,
        getDecisionColor,
    } = useAuditLog();

    const handleLoadMore = () => {
        loadAuditLog(entries.length + 10, 0);
    };

    if (!activeAddress) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Audit Log</h2>
                    <p className="text-gray-500">Please connect your wallet to view your audit log.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Audit Log
                    <span className="badge badge-neutral">{total} entries</span>
                </h2>

                {loading && entries.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : error ? (
                    <div className="alert alert-error">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No audit entries found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Decision</th>
                                        <th>Risk Score</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="font-mono text-sm">#{entry.id}</td>
                                            <td>
                                                <span className={`badge ${getDecisionColor(entry.decision)}`}>
                                                    {getDecisionLabel(entry.decision)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <progress
                                                        className="progress progress-xs w-24"
                                                        value={entry.risk_score}
                                                        max="100"
                                                    ></progress>
                                                    <span className="text-sm">{entry.risk_score}</span>
                                                </div>
                                            </td>
                                            <td className="font-mono text-sm">
                                                Round {entry.timestamp}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {entries.length < total && (
                            <div className="card-actions justify-end mt-4">
                                <button
                                    className="btn btn-outline"
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="loading loading-spinner"></span>
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More'
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
