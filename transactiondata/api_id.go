package transactiondata

type AppId int

const (
	AppIdSui       AppId = 0
	AppIdNarwhal   AppId = 1
	AppIdConsensus AppId = 2
)

func (c *AppId) Parse(data []byte, offset int) (int, error) {
	v, offset, err := ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	if v < 0 || v > 2 {
		return 0, ErrInvalidEnumValue
	}
	*c = AppId(v)
	return offset, nil
}
