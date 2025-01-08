package suisdk

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"regexp"
	"strconv"
	"strings"
)

type Address [32]byte

func ParseAddress(addrStr string) Address {
	var addr Address
	if len(addrStr) != 2+64 {
		return addr
	}
	if addrStr[:2] != "0x" {
		return addr
	}
	addrBytes, err := hex.DecodeString(addrStr[2:])
	if err != nil {
		return addr
	}
	copy(addr[:], addrBytes)
	return addr
}

type SuiCoinMetadata struct {
	Decimals    int    `json:"decimals"`
	Description string `json:"description"`
	IconUrl     string `json:"iconUrl"`
	Id          string `json:"id"`
	Name        string `json:"name"`
	Symbol      string `json:"symbol"`
}

type TransactionBlockResponseOptions struct {
	ShowInput          bool `json:"showInput"`
	ShowRawInput       bool `json:"showRawInput"`
	ShowEffects        bool `json:"showEffects"`
	ShowEvents         bool `json:"showEvents"`
	ShowObjectChanges  bool `json:"showObjectChanges"`
	ShowBalanceChanges bool `json:"showBalanceChanges"`
	ShowRawEffects     bool `json:"showRawEffects"`
}

type TransactionBlock struct {
	Data         TransactionBlockData `json:"data"`
	TxSignatures []string             `json:"txSignatures"`
}

type TransactionBlockData struct {
	GasData        GasData              `json:"gasData"`
	MessageVersion string               `json:"messageVersion"`
	Sender         string               `json:"sender"`
	Transaction    TransactionBlockKind `json:"transaction"`
}

type TransactionBlockKind struct {
	Computation_charge       string `json:"computation_charge"`
	Epoch                    string `json:"epoch"`
	Epoch_start_timestamp_ms string `json:"epoch_start_timestamp_ms"`
	Kind                     string `json:"kind"`
	Storage_charge           string `json:"storage_charge"`
	Storage_rebate           string `json:"storage_rebate"`
}

type GasData struct {
	Budget  string    `json:"budget"`
	Owner   string    `json:"owner"`
	Payment []Payment `json:"payment"`
	Price   string    `json:"price"`
}

/*
"data": {
          "objectId": "0x26ed170e0427f9416a614d23284116375c16bd317738fd2c7a885362e04923f5",
          "version": "13488",
          "digest": "5Ka3vDaDy9h5UYk3Maz3vssWHrhbcGXQgwg8fL2ygyTi",
          "type": "0x2::coin::Coin<0x2::sui::SUI>",
          "owner": {
            "AddressOwner": "0x0cd4bb4d4f520fe9bbf0cf1cebe3f2549412826c3c9261bff9786c240123749f"
          },
          "previousTransaction": "FLSfkL1pVTxv724z5kfPbTq2KsWP1HEKBwZQ57uRZU11",
          "storageRebate": "100"
        }
*/

type Owner struct {
	AddressOwner string `json:"AddressOwner"`
}

type ObjectInfoData struct {
	ObjectId            string      `json:"objectId"`
	Version             string      `json:"version"`
	Digest              string      `json:"digest"`
	Type                string      `json:"type"`
	Owner               Owner       `json:"owner"`
	PreviousTransaction string      `json:"previousTransaction"`
	StorageRebate       string      `json:"storageRebate"`
	Content             interface{} `json:"content"`
}

type ObjectInfo struct {
	Data ObjectInfoData `json:"data"`
}

type ObjectsPage struct {
	Data        []ObjectInfo `json:"data"`
	HasNextPage bool         `json:"hasNextPage"`
	NextCursor  string       `json:"nextCursor"`
}

type Payment struct {
	ObjectId string `json:"objectId"`
	Version  int    `json:"version"`
	Digest   string `json:"digest"`
}

type TransactionBlockBytes struct {
	Gas string `json:"gas"`
	// InputObjects []InputObject `json:"inputObjects"`
	TxBytes string `json:"txBytes"`
}

type Key struct {
	Key       []byte
	ChainCode []byte
}

const (
	FirstHardenedIndex = uint32(0x80000000)
	seedModifier       = "ed25519 seed"
)

var (
	ErrInvalidPath        = errors.New("invalid derivation path")
	ErrNoPublicDerivation = errors.New("no public derivation for ed25519")

	pathRegex = regexp.MustCompile(`^m(\/[0-9]+')+$`)
)

// NewMasterKey generates a new master key from seed.
func NewMasterKey(seed []byte) (*Key, error) {
	hash := hmac.New(sha512.New, []byte(seedModifier))
	_, err := hash.Write(seed)
	if err != nil {
		return nil, err
	}
	sum := hash.Sum(nil)
	key := &Key{
		Key:       sum[:32],
		ChainCode: sum[32:],
	}
	return key, nil
}

func isValidPath(path string) bool {
	if !pathRegex.MatchString(path) {
		return false
	}

	// Check for overflows
	segments := strings.Split(path, "/")
	for _, segment := range segments[1:] {
		_, err := strconv.ParseUint(strings.TrimRight(segment, "'"), 10, 32)
		if err != nil {
			return false
		}
	}

	return true
}

func (k *Key) Derive(i uint32) (*Key, error) {
	// no public derivation for ed25519
	if i < FirstHardenedIndex {
		return nil, ErrNoPublicDerivation
	}

	iBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(iBytes, i)
	key := append([]byte{0x0}, k.Key...)
	data := append(key, iBytes...)

	hash := hmac.New(sha512.New, k.ChainCode)
	_, err := hash.Write(data)
	if err != nil {
		return nil, err
	}
	sum := hash.Sum(nil)
	newKey := &Key{
		Key:       sum[:32],
		ChainCode: sum[32:],
	}
	return newKey, nil
}

func DeriveForPath(path string, seed []byte) (*Key, error) {
	if !isValidPath(path) {
		return nil, ErrInvalidPath
	}

	key, err := NewMasterKey(seed)
	if err != nil {
		return nil, err
	}

	segments := strings.Split(path, "/")
	for _, segment := range segments[1:] {
		i64, err := strconv.ParseUint(strings.TrimRight(segment, "'"), 10, 32)
		if err != nil {
			return nil, err
		}

		i := uint32(i64) + FirstHardenedIndex
		key, err = key.Derive(i)
		if err != nil {
			return nil, err
		}
	}

	return key, nil
}

/*
"payment": [
            {
              "objectId": "0x1a3e898029d024eec1d44c6af5e2facded84d03b5373514f16e3d66e00081051",
              "version": 2,
              "digest": "7nDZ5J4VyvYGUbX2f6mQdhkr3RFrb3vZqui1ogoyApD9"
            }
          ],
*/
