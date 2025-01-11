package transactiondata

import "errors"

type SuiAddress [32]byte

func (c *SuiAddress) Parse(data []byte, offset int) (int, error) {
	if len(data) < offset+32 {
		return 0, errors.New("data is too short")
	}

	copy(c[:], data[offset:offset+32])
	offset += 32
	return offset, nil
}
