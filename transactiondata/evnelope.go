package transactiondata

type Envelope struct {
	TransactionDataWithIntent TransactionDataWithIntent
}

func (c *Envelope) Parse(bs []byte, offset int) (int, error) {
	// ignoring first byte - todo: implement
	return c.TransactionDataWithIntent.Parse(bs, offset+1)
}
