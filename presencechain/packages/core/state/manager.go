package state

import (
	"encoding/json"
	"fmt"
	"math/big"
	"sync"

	"github.com/presencechain/core/db"
)

// StateManager manages blockchain state
type StateManager struct {
	db                *db.BadgerDB
	accounts          map[string]*Account
	latestBlockNumber uint64
	latestBlockHash   string
	mu                sync.RWMutex
}

// Account represents a blockchain account
type Account struct {
	Address  string
	Balance  *big.Int
	Nonce    uint64
	Code     []byte // Smart contract code
	Storage  map[string][]byte
}

// NewStateManager creates a new state manager
func NewStateManager(database *db.BadgerDB) *StateManager {
	return &StateManager{
		db:                database,
		accounts:          make(map[string]*Account),
		latestBlockNumber: 0,
		latestBlockHash:   "0x0",
	}
}

// GetAccount retrieves an account by address
func (sm *StateManager) GetAccount(address string) (*Account, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	// Check in-memory cache first
	if account, exists := sm.accounts[address]; exists {
		return account, nil
	}

	// Try to load from database
	data, err := sm.db.Get([]byte("account:" + address))
	if err != nil {
		return nil, err
	}

	if data == nil {
		// Account doesn't exist, return new account
		return &Account{
			Address: address,
			Balance: big.NewInt(0),
			Nonce:   0,
			Storage: make(map[string][]byte),
		}, nil
	}

	var account Account
	if err := json.Unmarshal(data, &account); err != nil {
		return nil, err
	}

	return &account, nil
}

// UpdateAccount updates an account in state
func (sm *StateManager) UpdateAccount(account *Account) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	// Update in-memory cache
	sm.accounts[account.Address] = account

	// Persist to database
	data, err := json.Marshal(account)
	if err != nil {
		return err
	}

	return sm.db.Put([]byte("account:"+account.Address), data)
}

// GetBalance returns the balance of an address
func (sm *StateManager) GetBalance(address string) *big.Int {
	account, err := sm.GetAccount(address)
	if err != nil || account == nil {
		return big.NewInt(0)
	}
	return account.Balance
}

// SetBalance sets the balance of an address
func (sm *StateManager) SetBalance(address string, balance *big.Int) error {
	account, err := sm.GetAccount(address)
	if err != nil {
		return err
	}

	account.Balance = balance
	return sm.UpdateAccount(account)
}

// Transfer transfers value from one account to another
func (sm *StateManager) Transfer(from, to string, amount *big.Int) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	// Get sender account
	fromAccount, err := sm.GetAccount(from)
	if err != nil {
		return err
	}

	// Check sufficient balance
	if fromAccount.Balance.Cmp(amount) < 0 {
		return fmt.Errorf("insufficient balance")
	}

	// Get receiver account
	toAccount, err := sm.GetAccount(to)
	if err != nil {
		return err
	}

	// Perform transfer
	fromAccount.Balance = new(big.Int).Sub(fromAccount.Balance, amount)
	toAccount.Balance = new(big.Int).Add(toAccount.Balance, amount)

	// Update accounts
	if err := sm.UpdateAccount(fromAccount); err != nil {
		return err
	}
	if err := sm.UpdateAccount(toAccount); err != nil {
		return err
	}

	return nil
}

// GetLatestBlockNumber returns the latest block number
func (sm *StateManager) GetLatestBlockNumber() uint64 {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.latestBlockNumber
}

// GetLatestBlockHash returns the latest block hash
func (sm *StateManager) GetLatestBlockHash() string {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.latestBlockHash
}

// SetLatestBlock updates the latest block info
func (sm *StateManager) SetLatestBlock(number uint64, hash string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sm.latestBlockNumber = number
	sm.latestBlockHash = hash
}

// IncrementNonce increments an account's nonce
func (sm *StateManager) IncrementNonce(address string) error {
	account, err := sm.GetAccount(address)
	if err != nil {
		return err
	}

	account.Nonce++
	return sm.UpdateAccount(account)
}

// GetNonce returns an account's nonce
func (sm *StateManager) GetNonce(address string) (uint64, error) {
	account, err := sm.GetAccount(address)
	if err != nil {
		return 0, err
	}
	return account.Nonce, nil
}
