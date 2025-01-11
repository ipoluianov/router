package transactiondata

import (
	"encoding/binary"
	"fmt"
)

type SequenceNumber uint64

func (c SequenceNumber) String() string {
	return fmt.Sprint(uint64(c))
}

type SharedObject struct {
	Id                   ObjectID
	InitialSharedVersion SequenceNumber
	Mutable              bool
}

func (c *SharedObject) Parse(data []byte, offset int) (int, error) {
	// Parse ObjectID - fixed size 32 bytes
	if len(data) < offset+32 {
		return 0, ErrNotEnoughData
	}
	copy(c.Id[:], data[offset:offset+32])
	offset += 32

	// Parse InitialSharedVersion - fixed size 8 bytes
	if len(data) < offset+8 {
		return 0, ErrNotEnoughData
	}
	c.InitialSharedVersion = SequenceNumber(binary.LittleEndian.Uint64(data[offset : offset+8]))
	offset += 8

	// Parse Mutable - fixed size 1 byte
	if len(data) < offset+1 {
		return 0, ErrNotEnoughData
	}
	c.Mutable = data[offset] != 0
	offset++
	return offset, nil
}
