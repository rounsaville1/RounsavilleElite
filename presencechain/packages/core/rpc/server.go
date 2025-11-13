package rpc

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/presencechain/core/consensus"
	"github.com/presencechain/core/net"
	"github.com/presencechain/core/state"
)

// Server represents JSON-RPC server
type Server struct {
	port            int
	stateManager    *state.StateManager
	consensusEngine *consensus.PoSEngine
	networkNode     *net.P2PNode
	server          *http.Server
	mu              sync.RWMutex
}

// JSONRPCRequest represents a JSON-RPC 2.0 request
type JSONRPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
	ID      interface{}   `json:"id"`
}

// JSONRPCResponse represents a JSON-RPC 2.0 response
type JSONRPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	Result  interface{} `json:"result,omitempty"`
	Error   *RPCError   `json:"error,omitempty"`
	ID      interface{} `json:"id"`
}

// RPCError represents a JSON-RPC error
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// NewServer creates a new RPC server
func NewServer(port int, sm *state.StateManager, ce *consensus.PoSEngine, nn *net.P2PNode) *Server {
	return &Server{
		port:            port,
		stateManager:    sm,
		consensusEngine: ce,
		networkNode:     nn,
	}
}

// Start starts the RPC server
func (s *Server) Start() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handleRequest)

	s.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", s.port),
		Handler: s.enableCORS(mux),
	}

	return s.server.ListenAndServe()
}

// Stop stops the RPC server
func (s *Server) Stop() error {
	if s.server != nil {
		return s.server.Close()
	}
	return nil
}

// handleRequest handles incoming JSON-RPC requests
func (s *Server) handleRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req JSONRPCRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, nil, -32700, "Parse error")
		return
	}

	result, err := s.handleMethod(req.Method, req.Params)
	if err != nil {
		s.sendError(w, req.ID, -32603, err.Error())
		return
	}

	s.sendResult(w, req.ID, result)
}

// handleMethod routes RPC methods to their handlers
func (s *Server) handleMethod(method string, params []interface{}) (interface{}, error) {
	switch method {
	case "eth_blockNumber":
		return s.getBlockNumber()
	case "eth_getBalance":
		if len(params) < 1 {
			return nil, fmt.Errorf("missing address parameter")
		}
		address, ok := params[0].(string)
		if !ok {
			return nil, fmt.Errorf("invalid address parameter")
		}
		return s.getBalance(address)
	case "eth_sendTransaction":
		// TODO: Implement transaction sending
		return "0x0", nil
	case "net_version":
		return "1", nil // Mainnet ID
	case "net_peerCount":
		return len(s.networkNode.GetPeers()), nil
	case "web3_clientVersion":
		return "PresenceChain/v1.0.0", nil
	default:
		return nil, fmt.Errorf("method not found: %s", method)
	}
}

// getBlockNumber returns the latest block number
func (s *Server) getBlockNumber() (string, error) {
	blockNum := s.stateManager.GetLatestBlockNumber()
	return fmt.Sprintf("0x%x", blockNum), nil
}

// getBalance returns the balance of an address
func (s *Server) getBalance(address string) (string, error) {
	balance := s.stateManager.GetBalance(address)
	return fmt.Sprintf("0x%x", balance), nil
}

// sendResult sends a successful JSON-RPC response
func (s *Server) sendResult(w http.ResponseWriter, id interface{}, result interface{}) {
	response := JSONRPCResponse{
		JSONRPC: "2.0",
		Result:  result,
		ID:      id,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// sendError sends an error JSON-RPC response
func (s *Server) sendError(w http.ResponseWriter, id interface{}, code int, message string) {
	response := JSONRPCResponse{
		JSONRPC: "2.0",
		Error: &RPCError{
			Code:    code,
			Message: message,
		},
		ID: id,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// enableCORS adds CORS headers
func (s *Server) enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
