package transactiondata

import "errors"

type Command struct {
}

func (c *Command) Parse(data []byte, offset int) (int, error) {
	return 0, errors.New("not implemented")
}
