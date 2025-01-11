package transactiondata

import "errors"

type ObjectDigest struct {
}

func (c *ObjectDigest) Parse(data []byte, offset int) (int, error) {
	return 0, errors.New("not implemented")
}
