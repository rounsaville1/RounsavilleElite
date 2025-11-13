interface HeaderProps {
  owner: string;
  syncProgress: number;
  isRunning: boolean;
}

export default function Header({ owner, syncProgress, isRunning }: HeaderProps) {
  return (
    <header className="bg-black border-b border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-orange rounded-lg flex items-center justify-center text-white font-bold text-xl bitcoin-shadow">
              ₿
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                Bitcoin Full Node
              </h1>
              <p className="text-xs text-gray-400">Owner: {owner}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Sync Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <div className="text-sm">
              <div className="text-gray-400">Node Status</div>
              <div className="font-semibold text-white">
                {isRunning ? 'Running' : 'Offline'}
              </div>
            </div>
          </div>

          {/* Sync Progress */}
          {isRunning && syncProgress < 100 && (
            <div className="flex items-center gap-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">Blockchain Sync</div>
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-orange transition-all duration-500"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
              <div className="text-sm font-mono text-orange-400">
                {syncProgress.toFixed(2)}%
              </div>
            </div>
          )}

          {/* Mode Indicator */}
          <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-xs font-semibold text-orange-400">
            MAINNET • OFFLINE MODE
          </div>
        </div>
      </div>
    </header>
  );
}
