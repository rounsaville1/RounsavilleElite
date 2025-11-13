import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../api';
import { Cube, Activity, Users } from 'lucide-react';

export default function HomePage() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 10000,
  });

  const { data: blocksData } = useQuery({
    queryKey: ['blocks', { limit: 10 }],
    queryFn: () => api.getBlocks(10),
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-8">
      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Cube className="text-blue-400" size={24} />
            <div className="text-gray-400 text-sm">Latest Block</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {stats?.latestBlock?.toLocaleString() || '0'}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-green-400" size={24} />
            <div className="text-gray-400 text-sm">Transactions</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {stats?.totalTransactions?.toLocaleString() || '0'}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-purple-400" size={24} />
            <div className="text-gray-400 text-sm">Validators</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {stats?.validators || '0'}
          </div>
        </div>
      </div>

      {/* Recent Blocks */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Latest Blocks</h2>

        <div className="space-y-3">
          {blocksData?.blocks.map((block: any) => (
            <Link
              key={block.number}
              to={`/blocks/${block.number}`}
              className="flex items-center justify-between p-4 bg-black/30 hover:bg-black/50 rounded-lg transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Cube className="text-blue-400" size={24} />
                </div>
                <div>
                  <div className="text-white font-semibold">Block #{block.number}</div>
                  <div className="text-gray-400 text-sm">
                    {formatDistanceToNow(new Date(block.timestamp * 1000), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-white text-sm">{block.transaction_count} txns</div>
                <div className="text-gray-400 text-xs">
                  Validator: {block.validator?.slice(0, 10)}...
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          to="/blocks"
          className="block mt-6 text-center text-blue-400 hover:text-blue-300 transition"
        >
          View All Blocks →
        </Link>
      </div>
    </div>
  );
}
