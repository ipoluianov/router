package transactiondata

import "errors"

type EndOfEpochTransactionKind struct {
}

func (c *EndOfEpochTransactionKind) ToBytes() []byte {
	return []byte{}
}

func (c *EndOfEpochTransactionKind) Parse(data []byte, offset int) (int, error) {
	return 0, errors.New("not implemented")
}
