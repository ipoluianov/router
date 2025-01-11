package transactiondata

type TransferObjects struct {
}

func (c *TransferObjects) Parse(data []byte, offset int) (int, error) {
	return 0, ErrNotImplemented
}
