package transactiondata

import (
	"encoding/binary"
	"errors"
)

// pub type ObjectRef = (ObjectID, SequenceNumber, ObjectDigest);

type ObjectRef struct {
	ObjectID       ObjectID
	SequenceNumber SequenceNumber
	ObjectDigest   *ObjectDigest
}

func (c *ObjectRef) Parse(data []byte, offset int) (int, error) {
	var err error
	if len(data) < offset+32 {
		return 0, errors.New("not enough data")
	}
	copy(c.ObjectID[:], data[offset:offset+32])
	offset += 32
	if len(data) < offset+8 {
		return 0, errors.New("not enough data")
	}
	c.SequenceNumber = SequenceNumber(binary.LittleEndian.Uint64(data[offset : offset+8]))
	offset += 8

	c.ObjectDigest = &ObjectDigest{}
	offset, err = c.ObjectDigest.Parse(data, offset)
	if err != nil {
		return 0, err
	}
	return offset, nil
}
