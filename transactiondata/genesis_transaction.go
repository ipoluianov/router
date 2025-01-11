package transactiondata

import "errors"

type GenesisTransaction struct {
}

func (c *GenesisTransaction) Parse(data []byte, offset int) (int, error) {
	return 0, errors.New("not implemented")
}
