package suisdk

import "encoding/hex"

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

type Payment struct {
	ObjectId string `json:"objectId"`
	Version  int    `json:"version"`
	Digest   string `json:"digest"`
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
