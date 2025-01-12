package transactiondata

type TypeInput struct {
	Type            TypeInputType
	VectorTypeInput *TypeInput
	StructInput     *StructInput
}

type TypeInputType int

const (
	TypeInputBool    TypeInputType = 0
	TypeInputU8      TypeInputType = 1
	TypeInputU64     TypeInputType = 2
	TypeInputU128    TypeInputType = 3
	TypeInputAddress TypeInputType = 4
	TypeInputSigner  TypeInputType = 5
	TypeInputVector  TypeInputType = 6
	TypeInputStruct  TypeInputType = 7
	TypeInputU16     TypeInputType = 8
	TypeInputU32     TypeInputType = 9
	TypeInputU256    TypeInputType = 10
)

func (c *TypeInput) ToBytes() []byte {
	var data []byte

	data = append(data, SerializeULEB128(int(c.Type))...)

	if c.Type == TypeInputVector {
		data = append(data, c.VectorTypeInput.ToBytes()...)
	}
	if c.Type == TypeInputStruct {
		data = append(data, c.StructInput.ToBytes()...)
	}

	return data
}

func (c *TypeInput) Parse(data []byte, offset int) (int, error) {
	tpInput, offset, err := ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	if tpInput < 0 || tpInput > 10 {
		return 0, ErrInvalidEnumValue
	}
	c.Type = TypeInputType(tpInput)
	if c.Type == TypeInputVector {
		c.VectorTypeInput = &TypeInput{}
		offset, err = c.VectorTypeInput.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	}
	if c.Type == TypeInputStruct {
		c.StructInput = &StructInput{}
		offset, err = c.StructInput.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	}
	return offset, nil
}
