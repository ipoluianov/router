package suisdk

import (
	"crypto"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/hex"
	"log"
	"math"

	"github.com/tyler-smith/go-bip39"
	"golang.org/x/crypto/blake2b"
)

type Account struct {
	PriKey  ed25519.PrivateKey
	PubKey  ed25519.PublicKey
	Address string
}

func NewAccountFromAdress(address string) *Account {
	var c Account
	c.Address = address
	return &c
}

const (
	SigntureFlagEd25519     = 0x0
	SigntureFlagSecp256k1   = 0x1
	AddressLength           = 64
	DerivationPathEd25519   = `m/44'/784'/0'/0'/0'`
	DerivationPathSecp256k1 = `m/54'/784'/0'/0/0`
)

type KeyPair byte

const (
	Ed25519Flag   KeyPair = 0
	Secp256k1Flag KeyPair = 1
	ErrorFlag     byte    = math.MaxUint8
)

func NewAccountFromMnemonic(mnemonic string) (*Account, error) {
	var c Account
	seed, err := bip39.NewSeedWithErrorChecking(mnemonic, "")
	if err != nil {
		return nil, err
	}
	key, err := DeriveForPath("m/44'/784'/0'/0'/0'", seed)
	if err != nil {
		return nil, err
	}

	c.PriKey = ed25519.NewKeyFromSeed(key.Key)
	c.PubKey = c.PriKey.Public().(ed25519.PublicKey)

	tmp := []byte{byte(Ed25519Flag)}
	tmp = append(tmp, c.PubKey...)
	addrBytes := blake2b.Sum256(tmp)
	c.Address = "0x" + hex.EncodeToString(addrBytes[:])[:AddressLength]
	return &c, nil
}

type SignedMessageSerializedSig struct {
	Message   string `json:"message"`
	Signature string `json:"signature"`
}

type SignedTransactionSerializedSig struct {
	TxBytes   string `json:"txBytes"`
	Signature string `json:"signature"`
}

type IntentScope = uint8

const (
	TransactionDataIntentScope    IntentScope = 0
	TransactionEffectsIntentScope IntentScope = 1
	CheckpointSummaryIntentScope  IntentScope = 2
	PersonalMessageIntentScope    IntentScope = 3
)

func (c *Account) NewMessageWithIntent(message []byte, scope IntentScope) []byte {
	intent := []byte{scope, 0, 0}
	intentMessage := make([]byte, len(intent)+len(message))
	copy(intentMessage, intent)
	copy(intentMessage[len(intent):], message)
	return intentMessage
}

type SigFlag byte

const (
	SigFlagEd25519   SigFlag = 0x00
	SigFlagSecp256k1 SigFlag = 0x01
)

func (c *Account) ToSerializedSignature(signature, pubKey []byte) string {
	signatureLen := len(signature)
	pubKeyLen := len(pubKey)
	serializedSignature := make([]byte, 1+signatureLen+pubKeyLen)
	serializedSignature[0] = byte(SigFlagEd25519)
	copy(serializedSignature[1:], signature)
	copy(serializedSignature[1+signatureLen:], pubKey)
	return base64.StdEncoding.EncodeToString(serializedSignature)
}

func (c *Account) SignMessage(data string, scope IntentScope) (*SignedMessageSerializedSig, error) {
	txBytes, _ := base64.StdEncoding.DecodeString(data)
	message := c.NewMessageWithIntent(txBytes, scope)
	digest := blake2b.Sum256(message)
	var noHash crypto.Hash
	sigBytes, err := c.PriKey.Sign(nil, digest[:], noHash)
	if err != nil {
		return nil, err
	}

	ret := &SignedMessageSerializedSig{
		Message:   data,
		Signature: c.ToSerializedSignature(sigBytes, c.PriKey.Public().(ed25519.PublicKey)),
	}
	return ret, nil
}

var IntentBytes = []byte{0, 0, 0}

func messageWithIntent(message []byte) []byte {
	intent := IntentBytes
	intentMessage := make([]byte, len(intent)+len(message))
	copy(intentMessage, intent)
	copy(intentMessage[len(intent):], message)
	return intentMessage
}

func (c *Account) Signature(txBytesStr string) (*SignedTransactionSerializedSig, error) {
	privateKey := c.PriKey
	txBytes, _ := base64.StdEncoding.DecodeString(txBytesStr)
	message := messageWithIntent(txBytes)
	digest := blake2b.Sum256(message)
	var noHash crypto.Hash
	sigBytes, err := privateKey.Sign(nil, digest[:], noHash)
	if err != nil {
		log.Fatal(err)
	}
	return &SignedTransactionSerializedSig{
		TxBytes:   txBytesStr,
		Signature: c.ToSerializedSignature(sigBytes, privateKey.Public().(ed25519.PublicKey)),
	}, nil
}
