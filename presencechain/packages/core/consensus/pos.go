package consensus

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"sync"
	"time"

	"github.com/presencechain/core/state"
)

// PoSEngine implements Proof-of-Stake consensus
type PoSEngine struct {
	stateManager *state.StateManager
	isValidator  bool
	validators   map[string]*Validator
	currentEpoch uint64
	mu           sync.RWMutex
	stopChan     chan struct{}
}

// Validator represents a network validator
type Validator struct {
	Address    string
	Stake      *big.Int
	PublicKey  []byte
	Active     bool
	LastBlock  uint64
	Rewards    *big.Int
}

// Block represents a blockchain block
type Block struct {
	Number       uint64
	Hash         string
	PreviousHash string
	Timestamp    int64
	Validator    string
	Transactions []Transaction
	StateRoot    string
}

// Transaction represents a blockchain transaction
type Transaction struct {
	Hash      string
	From      string
	To        string
	Value     *big.Int
	Nonce     uint64
	Signature []byte
	GasLimit  uint64
	GasPrice  *big.Int
}

// NewPoSEngine creates a new Proof-of-Stake consensus engine
func NewPoSEngine(sm *state.StateManager, isValidator bool) *PoSEngine {
	return &PoSEngine{
		stateManager: sm,
		isValidator:  isValidator,
		validators:   make(map[string]*Validator),
		currentEpoch: 0,
		stopChan:     make(chan struct{}),
	}
}

// Start begins the consensus engine
func (p *PoSEngine) Start() {
	ticker := time.NewTicker(12 * time.Second) // 12 second block time
	defer ticker.Stop()

	fmt.Println("⛏️  Consensus engine started")

	for {
		select {
		case <-ticker.C:
			if p.isValidator {
				p.proposeBlock()
			}
			p.updateEpoch()
		case <-p.stopChan:
			return
		}
	}
}

// Stop halts the consensus engine
func (p *PoSEngine) Stop() {
	close(p.stopChan)
}

// proposeBlock creates and broadcasts a new block
func (p *PoSEngine) proposeBlock() {
	p.mu.Lock()
	defer p.mu.Unlock()

	// Simple block creation logic
	blockNumber := p.stateManager.GetLatestBlockNumber() + 1
	previousHash := p.stateManager.GetLatestBlockHash()

	block := &Block{
		Number:       blockNumber,
		PreviousHash: previousHash,
		Timestamp:    time.Now().Unix(),
		Validator:    "self", // TODO: Use actual validator address
		Transactions: []Transaction{},
	}

	// Calculate block hash
	block.Hash = p.calculateBlockHash(block)

	// TODO: Broadcast block to network
	fmt.Printf("📦 Proposed block #%d (hash: %s)\n", block.Number, block.Hash[:8])
}

// calculateBlockHash computes the hash of a block
func (p *PoSEngine) calculateBlockHash(block *Block) string {
	data := fmt.Sprintf("%d%s%d%s",
		block.Number,
		block.PreviousHash,
		block.Timestamp,
		block.Validator,
	)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// updateEpoch checks if epoch should advance
func (p *PoSEngine) updateEpoch() {
	// Epoch logic (e.g., every 100 blocks)
	latestBlock := p.stateManager.GetLatestBlockNumber()
	newEpoch := latestBlock / 100

	if newEpoch > p.currentEpoch {
		p.mu.Lock()
		p.currentEpoch = newEpoch
		p.mu.Unlock()
		fmt.Printf("🔄 Epoch advanced to %d\n", newEpoch)
	}
}

// RegisterValidator adds a validator to the set
func (p *PoSEngine) RegisterValidator(address string, stake *big.Int, pubKey []byte) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	validator := &Validator{
		Address:   address,
		Stake:     stake,
		PublicKey: pubKey,
		Active:    true,
		Rewards:   big.NewInt(0),
	}

	p.validators[address] = validator
	fmt.Printf("✓ Validator registered: %s (stake: %s)\n", address, stake.String())
	return nil
}

// GetValidators returns all active validators
func (p *PoSEngine) GetValidators() []*Validator {
	p.mu.RLock()
	defer p.mu.RUnlock()

	validators := make([]*Validator, 0, len(p.validators))
	for _, v := range p.validators {
		if v.Active {
			validators = append(validators, v)
		}
	}
	return validators
}
