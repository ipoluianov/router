package transactiondata

type MergeCoins struct {
}

func (c *MergeCoins) Parse(data []byte, offset int) (int, error) {
	return 0, ErrNotImplemented
}
