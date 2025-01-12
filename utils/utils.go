package utils

import "encoding/hex"

func ParseHex(hexData string) []byte {
	var result []byte
	if len(hexData) >= 2 && hexData[:2] == "0x" {
		hexData = hexData[2:]
	}
	result, err := hex.DecodeString(hexData)
	if err != nil {
		return nil
	}
	return result
}
