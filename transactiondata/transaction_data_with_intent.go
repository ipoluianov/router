package transactiondata

type TransactionDataWithIntent struct {
	Intent *Intent
	Data   *TransactionData
}

func (c *TransactionDataWithIntent) Parse(data []byte, offset int) (int, error) {
	c.Intent = &Intent{}
	offset, err := c.Intent.Parse(data, offset)
	if err != nil {
		return offset, err
	}
	c.Data = &TransactionData{}
	offset, err = c.Data.Parse(data, offset)
	if err != nil {
		return offset, err
	}
	return offset, nil
}
