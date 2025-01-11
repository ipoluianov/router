package transactiondata

type ObjectDigest struct {
	Digest []byte
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
