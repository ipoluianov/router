package transactiondata

type SplitCoins struct {
}

func (c *SplitCoins) Parse(data []byte, offset int) (int, error) {
	return 0, ErrNotImplemented
}
