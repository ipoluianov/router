package transactiondata

import "errors"

type GasData struct {
}

func (c *GasData) Parse(data []byte, offset int) (int, error) {
	return 0, errors.New("not implemented")
}
