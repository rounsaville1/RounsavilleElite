package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/presencechain/core/consensus"
	"github.com/presencechain/core/db"
	"github.com/presencechain/core/net"
	"github.com/presencechain/core/rpc"
	"github.com/presencechain/core/state"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	version = "1.0.0"
	cfgFile string
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "presencechain",
		Short: "PresenceCoin Mainnet Node",
		Long:  `PresenceCoin - A Proof-of-Stake blockchain with smart contract support`,
		Run:   runNode,
	}

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is ./config.yaml)")
	rootCmd.PersistentFlags().String("data-dir", "./data", "data directory for blockchain storage")
	rootCmd.PersistentFlags().Int("rpc-port", 8545, "JSON-RPC port")
	rootCmd.PersistentFlags().Int("p2p-port", 30303, "P2P networking port")
	rootCmd.PersistentFlags().Bool("validator", false, "run as validator node")

	viper.BindPFlags(rootCmd.PersistentFlags())

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func runNode(cmd *cobra.Command, args []string) {
	fmt.Printf("🚀 Starting PresenceCoin Node v%s\n", version)

	// Initialize configuration
	initConfig()

	// Initialize database
	dataDir := viper.GetString("data-dir")
	database, err := db.NewBadgerDB(dataDir)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()
	fmt.Println("✓ Database initialized")

	// Initialize state manager
	stateManager := state.NewStateManager(database)
	fmt.Println("✓ State manager initialized")

	// Initialize consensus engine
	isValidator := viper.GetBool("validator")
	consensusEngine := consensus.NewPoSEngine(stateManager, isValidator)
	fmt.Println("✓ Consensus engine initialized")

	// Initialize P2P network
	p2pPort := viper.GetInt("p2p-port")
	networkNode, err := net.NewP2PNode(p2pPort, consensusEngine)
	if err != nil {
		log.Fatalf("Failed to initialize P2P network: %v", err)
	}
	defer networkNode.Stop()
	fmt.Printf("✓ P2P network listening on port %d\n", p2pPort)

	// Start RPC server
	rpcPort := viper.GetInt("rpc-port")
	rpcServer := rpc.NewServer(rpcPort, stateManager, consensusEngine, networkNode)
	go func() {
		if err := rpcServer.Start(); err != nil {
			log.Fatalf("Failed to start RPC server: %v", err)
		}
	}()
	fmt.Printf("✓ JSON-RPC server listening on port %d\n", rpcPort)

	// Start consensus
	go consensusEngine.Start()
	fmt.Println("✓ Consensus engine started")

	fmt.Println("\n🎉 PresenceCoin node is running!")
	fmt.Printf("   RPC endpoint: http://localhost:%d\n", rpcPort)
	fmt.Printf("   P2P address: /ip4/127.0.0.1/tcp/%d\n", p2pPort)
	fmt.Println("\nPress Ctrl+C to stop...")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	fmt.Println("\n\n🛑 Shutting down gracefully...")
	rpcServer.Stop()
	fmt.Println("✓ Node stopped")
}

func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
		viper.AddConfigPath(".")
	}

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err == nil {
		fmt.Println("✓ Using config file:", viper.ConfigFileUsed())
	}
}
