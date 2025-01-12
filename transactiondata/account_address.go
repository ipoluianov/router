package transactiondata

type AccountAddress [32]byte

func (c *AccountAddress) ToBytes() []byte {
	return c[:]
}

func (c *AccountAddress) Parse(data []byte, offset int) (int, error) {
	if len(data) < offset+32 {
		return 0, ErrNotEnoughData
	}
	copy(c[:], data[offset:offset+32])
	return offset + 32, nil
}
