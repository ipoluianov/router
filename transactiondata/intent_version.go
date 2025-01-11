package transactiondata

type IntentVersion int

const (
	IntentVersionV1 IntentVersion = 0
)

func (c *IntentVersion) Parse(data []byte, offset int) (int, error) {
	if len(data) < offset+1 {
		return 0, ErrNotEnoughData
	}
	if data[offset] != 0 {
		return 0, ErrInvalidEnumValue
	}
	*c = IntentVersion(data[offset])
	return offset + 1, nil
}
