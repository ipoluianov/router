package transactiondata

import (
	"encoding/binary"
	"errors"
)

type SequenceNumber uint64
type ObjectID [32]byte

type SharedObject struct {
	Id                   ObjectID
	InitialSharedVersion SequenceNumber
	Mutable              bool
}

func (c *SharedObject) Parse(data []byte, offset int) (int, error) {
	if len(data) < offset+32 {
		return 0, errors.New("not enough data")
	}
	copy(c.Id[:], data[offset:offset+32])
	offset += 32
	if len(data) < offset+8 {
		return 0, errors.New("not enough data")
	}
	c.InitialSharedVersion = SequenceNumber(binary.LittleEndian.Uint64(data[offset : offset+8]))
	offset += 8
	if len(data) < offset+1 {
		return 0, errors.New("not enough data")
	}
	c.Mutable = data[offset] != 0
	offset++
	return offset, nil
}
