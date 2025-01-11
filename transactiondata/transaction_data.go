package transactiondata

type TransactionDataVersion int

const (
	TransactionDataVersionV1 TransactionDataVersion = 0
	TransactionDataVersionV2 TransactionDataVersion = 1
)

type TransactionData struct {
	Version TransactionDataVersion
	V1      *TransactionDataV1
	V2      *TransactionDataV2
}

func NewTransactionData() *TransactionData {
	var c TransactionData
	return &c
}

func NewTransactionDataV1() *TransactionData {
	var c TransactionData
	c.Version = TransactionDataVersionV1
	c.V1 = &TransactionDataV1{}
	return &c
}

func NewTransactionDataV2() *TransactionData {
	var c TransactionData
	c.Version = TransactionDataVersionV2
	c.V2 = &TransactionDataV2{}
	return &c
}

func (c *TransactionData) Parse(data []byte, offset int) (int, error) {
	if len(data) < offset+1 {
		return 0, ErrNotEnoughData
	}
	if data[offset] != 0 && data[offset] != 1 {
		return 0, ErrInvalidEnumValue
	}
	c.Version = TransactionDataVersion(data[offset])
	switch c.Version {
	case TransactionDataVersionV1:
		c.V1 = &TransactionDataV1{}
		return c.V1.Parse(data, offset+1)
	case TransactionDataVersionV2:
		c.V2 = &TransactionDataV2{}
		return c.V2.Parse(data, offset+1)
	}
	return 0, ErrInvalidEnumValue
}
