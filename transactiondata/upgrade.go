package transactiondata

type Upgrade struct {
}

func (c *Upgrade) Parse(data []byte, offset int) (int, error) {
	return 0, ErrNotImplemented
}
