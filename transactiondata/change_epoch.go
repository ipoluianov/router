package transactiondata

import "errors"

type ChangeEpoch struct {
}

func (c *ChangeEpoch) Parse(data []byte, offset int) (int, error) {
	return 0, errors.New("not implemented")
}
