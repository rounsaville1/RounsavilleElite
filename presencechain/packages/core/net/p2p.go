package net

import (
	"context"
	"fmt"

	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multiaddr"
	"github.com/presencechain/core/consensus"
)

// P2PNode represents a libp2p network node
type P2PNode struct {
	host            host.Host
	ctx             context.Context
	cancel          context.CancelFunc
	consensusEngine *consensus.PoSEngine
	peers           []peer.ID
}

// NewP2PNode creates a new P2P network node
func NewP2PNode(port int, consensusEngine *consensus.PoSEngine) (*P2PNode, error) {
	ctx, cancel := context.WithCancel(context.Background())

	// Create libp2p host
	sourceMultiAddr, err := multiaddr.NewMultiaddr(fmt.Sprintf("/ip4/0.0.0.0/tcp/%d", port))
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to create multiaddr: %w", err)
	}

	host, err := libp2p.New(
		libp2p.ListenAddrs(sourceMultiAddr),
	)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to create libp2p host: %w", err)
	}

	node := &P2PNode{
		host:            host,
		ctx:             ctx,
		cancel:          cancel,
		consensusEngine: consensusEngine,
		peers:           make([]peer.ID, 0),
	}

	// Set up protocol handlers
	node.setupHandlers()

	return node, nil
}

// setupHandlers configures protocol handlers
func (n *P2PNode) setupHandlers() {
	// TODO: Implement protocol handlers for:
	// - Block propagation
	// - Transaction broadcasting
	// - Peer discovery
	// - Validator communication
}

// ConnectToPeer connects to a peer
func (n *P2PNode) ConnectToPeer(peerAddr string) error {
	addr, err := multiaddr.NewMultiaddr(peerAddr)
	if err != nil {
		return fmt.Errorf("invalid peer address: %w", err)
	}

	peerInfo, err := peer.AddrInfoFromP2pAddr(addr)
	if err != nil {
		return fmt.Errorf("failed to parse peer info: %w", err)
	}

	if err := n.host.Connect(n.ctx, *peerInfo); err != nil {
		return fmt.Errorf("failed to connect to peer: %w", err)
	}

	n.peers = append(n.peers, peerInfo.ID)
	return nil
}

// BroadcastBlock broadcasts a block to all peers
func (n *P2PNode) BroadcastBlock(block *consensus.Block) error {
	// TODO: Implement block broadcasting
	return nil
}

// BroadcastTransaction broadcasts a transaction to all peers
func (n *P2PNode) BroadcastTransaction(tx *consensus.Transaction) error {
	// TODO: Implement transaction broadcasting
	return nil
}

// GetPeers returns connected peers
func (n *P2PNode) GetPeers() []peer.ID {
	return n.peers
}

// Stop gracefully stops the P2P node
func (n *P2PNode) Stop() error {
	n.cancel()
	return n.host.Close()
}

// GetHostID returns the host's peer ID
func (n *P2PNode) GetHostID() peer.ID {
	return n.host.ID()
}

// GetAddresses returns the host's listen addresses
func (n *P2PNode) GetAddresses() []multiaddr.Multiaddr {
	return n.host.Addrs()
}
