package transactiondata

import (
	"encoding/binary"
)

type ObjectRef struct {
	ObjectID       ObjectID
	SequenceNumber SequenceNumber
	ObjectDigest   ObjectDigest
}

func SerializeUint64(i uint64) []byte {
	data := make([]byte, 8)
	binary.LittleEndian.PutUint64(data, i)
	return data
}

func (c *ObjectRef) ToBytes() []byte {
	var data []byte

	// Serialize ObjectID
	data = append(data, c.ObjectID[:]...)

	// Serialize SequenceNumber
	data = append(data, SerializeUint64(uint64(c.SequenceNumber))...)

	// Serialize ObjectDigest
	data = append(data, c.ObjectDigest.ToBytes()...)

	return data
}

func (c *ObjectRef) String() string {
	return "ObjectRef { ObjectID: " + c.ObjectID.String() + ", SequenceNumber: " + c.SequenceNumber.String() + ", ObjectDigest: " + c.ObjectDigest.String() + " }"
}

func (c *ObjectRef) Parse(data []byte, offset int) (int, error) {
	var err error

	// Parse ObjectID - fixed size 32 bytes
	if len(data) < offset+32 {
		return 0, ErrNotEnoughData
	}
	copy(c.ObjectID[:], data[offset:offset+32])
	offset += 32

	// Parse SequenceNumber - fixed size 8 bytes
	if len(data) < offset+8 {
		return 0, ErrNotEnoughData
	}
	c.SequenceNumber = SequenceNumber(binary.LittleEndian.Uint64(data[offset : offset+8]))
	offset += 8

	// Parse ObjectDigest
	c.ObjectDigest = ObjectDigest{}
	offset, err = c.ObjectDigest.Parse(data, offset)
	if err != nil {
		return 0, err
	}
	return offset, nil
}
