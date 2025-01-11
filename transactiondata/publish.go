package transactiondata

type Publish struct {
}

func (c *Publish) Parse(data []byte, offset int) (int, error) {
	return 0, ErrNotImplemented
}
