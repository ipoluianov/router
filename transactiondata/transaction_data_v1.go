package transactiondata

type TransactionDataV1 struct {
	Kind       *TransactionKind
	Sender     *SuiAddress
	GasData    *GasData
	Expiration *TransactionExpiration
}

func (c *TransactionDataV1) Parse(data []byte, offset int) (int, error) {
	var err error
	c.Kind = &TransactionKind{}
	c.Sender = &SuiAddress{}
	c.GasData = &GasData{}
	c.Expiration = &TransactionExpiration{}

	offset, err = c.Kind.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	offset, err = c.Sender.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	offset, err = c.GasData.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	offset, err = c.Expiration.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	return offset, nil
}
