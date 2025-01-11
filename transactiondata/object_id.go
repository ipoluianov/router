package transactiondata

type ObjectID [32]byte

func (c *ObjectID) Parse(data []byte, offset int) (int, error) {
	if len(data) < offset+32 {
		return 0, ErrNotEnoughData
	}

	copy(c[:], data[offset:offset+32])
	return offset + 32, nil
}
