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
