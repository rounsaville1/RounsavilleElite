package crypto

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"golang.org/x/crypto/ripemd160"
)

// GenerateKeyPair generates a new ECDSA key pair using secp256k1 curve
func GenerateKeyPair() (*ecdsa.PrivateKey, *ecdsa.PublicKey, error) {
	// Using P256 as secp256k1 requires external library
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate key pair: %w", err)
	}

	return privateKey, &privateKey.PublicKey, nil
}

// PublicKeyToAddress converts a public key to an address
func PublicKeyToAddress(pubKey *ecdsa.PublicKey) string {
	// Serialize public key
	pubKeyBytes := elliptic.Marshal(pubKey.Curve, pubKey.X, pubKey.Y)

	// SHA256 hash
	sha256Hash := sha256.Sum256(pubKeyBytes)

	// RIPEMD160 hash
	ripemd160Hasher := ripemd160.New()
	ripemd160Hasher.Write(sha256Hash[:])
	publicKeyHash := ripemd160Hasher.Sum(nil)

	// Add version byte (0x00 for mainnet)
	versionedHash := append([]byte{0x00}, publicKeyHash...)

	// Double SHA256 for checksum
	firstHash := sha256.Sum256(versionedHash)
	secondHash := sha256.Sum256(firstHash[:])
	checksum := secondHash[:4]

	// Final address
	finalAddress := append(versionedHash, checksum...)
	return hex.EncodeToString(finalAddress)
}

// SignData signs data using a private key
func SignData(privateKey *ecdsa.PrivateKey, data []byte) ([]byte, error) {
	hash := sha256.Sum256(data)
	r, s, err := ecdsa.Sign(rand.Reader, privateKey, hash[:])
	if err != nil {
		return nil, fmt.Errorf("failed to sign data: %w", err)
	}

	// Combine r and s into signature
	signature := append(r.Bytes(), s.Bytes()...)
	return signature, nil
}

// VerifySignature verifies a signature using a public key
func VerifySignature(pubKey *ecdsa.PublicKey, data, signature []byte) bool {
	hash := sha256.Sum256(data)

	// Split signature into r and s
	r := new(big.Int).SetBytes(signature[:len(signature)/2])
	s := new(big.Int).SetBytes(signature[len(signature)/2:])

	return ecdsa.Verify(pubKey, hash[:], r, s)
}

// Hash256 performs double SHA256 hashing
func Hash256(data []byte) []byte {
	first := sha256.Sum256(data)
	second := sha256.Sum256(first[:])
	return second[:]
}
