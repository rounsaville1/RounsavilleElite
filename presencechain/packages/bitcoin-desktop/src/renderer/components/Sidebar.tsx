interface SidebarProps {
  currentPage: string;
  onPageChange: (page: any) => void;
}

const menuItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'wallet', icon: '💼', label: 'Wallet' },
  { id: 'transactions', icon: '📝', label: 'Transactions' },
  { id: 'network', icon: '🌐', label: 'Network' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-black border-r border-gray-800 flex flex-col">
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPage === item.id
                  ? 'bg-gradient-orange text-white bitcoin-shadow'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="glass rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Security Level</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="w-full h-full bg-green-500" />
            </div>
            <span className="text-xs font-semibold text-green-400">MAX</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            🔒 Full Node • Offline • Encrypted
          </div>
        </div>
      </div>
    </aside>
  );
}
