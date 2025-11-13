import { Vote, CheckCircle, XCircle } from 'lucide-react';

export default function GovernancePage() {
  const proposals = [
    {
      id: 1,
      title: 'Reduce Block Time to 10 seconds',
      description: 'Proposal to decrease block time from 12s to 10s for faster transactions',
      status: 'active',
      votesFor: 1250000,
      votesAgainst: 340000,
      deadline: '2024-02-15',
    },
    {
      id: 2,
      title: 'Increase Validator Rewards',
      description: 'Increase validator block rewards by 15% to incentivize network security',
      status: 'active',
      votesFor: 980000,
      votesAgainst: 520000,
      deadline: '2024-02-20',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-white">Governance</h2>

      {/* Voting Power */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="text-sm opacity-80 mb-2">Your Voting Power</div>
        <div className="text-4xl font-bold">0 PSC</div>
        <div className="text-sm opacity-80 mt-2">
          Stake tokens to participate in governance
        </div>
      </div>

      {/* Active Proposals */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Active Proposals</h3>

        {proposals.map((proposal) => {
          const totalVotes = proposal.votesFor + proposal.votesAgainst;
          const forPercentage = (proposal.votesFor / totalVotes) * 100;

          return (
            <div
              key={proposal.id}
              className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {proposal.title}
                  </h4>
                  <p className="text-gray-400 text-sm">{proposal.description}</p>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                  Active
                </span>
              </div>

              {/* Vote Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-400">For: {forPercentage.toFixed(1)}%</span>
                  <span className="text-red-400">
                    Against: {(100 - forPercentage).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400"
                    style={{ width: `${forPercentage}%` }}
                  />
                </div>
              </div>

              {/* Vote Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors">
                  <CheckCircle size={18} />
                  Vote For
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors">
                  <XCircle size={18} />
                  Vote Against
                </button>
              </div>

              <div className="mt-4 text-gray-400 text-sm">
                Voting ends: {proposal.deadline}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
