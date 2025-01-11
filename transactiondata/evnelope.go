package transactiondata

type Envelope struct {
	TransactionDataWithIntent TransactionDataWithIntent
}

func (c *Envelope) Parse(bs []byte, offset int) (int, error) {
	return c.TransactionDataWithIntent.Parse(bs, offset+1)
}
