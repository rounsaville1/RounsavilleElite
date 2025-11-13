package db

import (
	"fmt"
	"path/filepath"

	badger "github.com/dgraph-io/badger/v3"
)

// BadgerDB wraps BadgerDB key-value store
type BadgerDB struct {
	db *badger.DB
}

// NewBadgerDB creates a new BadgerDB instance
func NewBadgerDB(dataDir string) (*BadgerDB, error) {
	dbPath := filepath.Join(dataDir, "badgerdb")

	opts := badger.DefaultOptions(dbPath)
	opts.Logger = nil // Disable BadgerDB logging

	db, err := badger.Open(opts)
	if err != nil {
		return nil, fmt.Errorf("failed to open BadgerDB: %w", err)
	}

	return &BadgerDB{db: db}, nil
}

// Get retrieves a value by key
func (b *BadgerDB) Get(key []byte) ([]byte, error) {
	var value []byte

	err := b.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get(key)
		if err != nil {
			return err
		}

		value, err = item.ValueCopy(nil)
		return err
	})

	if err == badger.ErrKeyNotFound {
		return nil, nil
	}

	return value, err
}

// Put stores a key-value pair
func (b *BadgerDB) Put(key, value []byte) error {
	return b.db.Update(func(txn *badger.Txn) error {
		return txn.Set(key, value)
	})
}

// Delete removes a key
func (b *BadgerDB) Delete(key []byte) error {
	return b.db.Update(func(txn *badger.Txn) error {
		return txn.Delete(key)
	})
}

// Close closes the database
func (b *BadgerDB) Close() error {
	return b.db.Close()
}

// Batch performs multiple operations atomically
func (b *BadgerDB) Batch(ops []Operation) error {
	return b.db.Update(func(txn *badger.Txn) error {
		for _, op := range ops {
			switch op.Type {
			case OpTypePut:
				if err := txn.Set(op.Key, op.Value); err != nil {
					return err
				}
			case OpTypeDelete:
				if err := txn.Delete(op.Key); err != nil {
					return err
				}
			}
		}
		return nil
	})
}

// Operation represents a database operation
type Operation struct {
	Type  OpType
	Key   []byte
	Value []byte
}

// OpType represents the type of database operation
type OpType int

const (
	OpTypePut OpType = iota
	OpTypeDelete
)
