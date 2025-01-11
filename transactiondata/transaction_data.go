package transactiondata

import "errors"

type TransactionData struct {
	V1 *TransactionDataV1
	V2 *TransactionDataV2
}

func NewTransactionData() *TransactionData {
	var c TransactionData
	return &c
}

func NewTransactionDataV1() *TransactionData {
	var c TransactionData
	c.V1 = &TransactionDataV1{}
	return &c
}

func NewTransactionDataV2() *TransactionData {
	var c TransactionData
	c.V2 = &TransactionDataV2{}
	return &c
}

func (c *TransactionData) Parse(data []byte, offset int) (int, error) {
	if len(data) == 0 {
		return 0, errors.New("empty data")
	}
	if data[0] == 0 {
		c.V1 = &TransactionDataV1{}
		c.V1.Parse(data, offset)
	}
	if data[0] == 1 {
		c.V2 = &TransactionDataV2{}
	}
	if data[0] != 0 && data[0] != 1 {
		return 0, errors.New("unknown version")
	}
	offset += 1
	return offset, nil
}
