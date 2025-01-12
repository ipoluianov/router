package transactiondata

import (
	"encoding/hex"

	"github.com/ipoluianov/router/utils"
)

type ObjectDigest struct {
	Digest []byte
}

func (c *ObjectDigest) ToBytes() []byte {
	var data []byte

	// Serialize the length of the digest
	data = append(data, SerializeULEB128(len(c.Digest))...)

	// Serialize the digest
	data = append(data, c.Digest...)

	return data
}

func (c *ObjectDigest) SetHex(hexData string) {
	bs := utils.ParseHex(hexData)
	c.Digest = make([]byte, len(bs))
	copy(c.Digest, bs)
}

func (c *ObjectDigest) String() string {
	return "ObjectDigest { Digest: " + hex.EncodeToString(c.Digest) + " }"
}

func (c *ObjectDigest) Parse(data []byte, offset int) (int, error) {
	var sizeOfDigest int
	var err error

	sizeOfDigest, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}

	if len(data) < offset+sizeOfDigest {
		return 0, ErrNotEnoughData
	}

	c.Digest = make([]byte, sizeOfDigest)
	copy(c.Digest, data[offset:offset+sizeOfDigest])
	offset += sizeOfDigest

	return offset, nil
}
