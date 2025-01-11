package transactiondata

type StructInput struct {
	Address    AccountAddress
	Module     string
	Name       string
	TypeParams []TypeInput
}

func (c *StructInput) Parse(data []byte, offset int) (int, error) {
	return 0, ErrNotImplemented
}
