package transactiondata

type StructInput struct {
	Address    AccountAddress
	Module     string
	Name       string
	TypeParams []TypeInput
}

func (c *StructInput) ToBytes() []byte {
	var data []byte

	data = append(data, c.Address.ToBytes()...)

	data = append(data, SerializeULEB128(len(c.Module))...)
	data = append(data, []byte(c.Module)...)

	data = append(data, SerializeULEB128(len(c.Name))...)
	data = append(data, []byte(c.Name)...)

	data = append(data, SerializeULEB128(len(c.TypeParams))...)
	for _, v := range c.TypeParams {
		data = append(data, v.ToBytes()...)
	}

	return data
}

func (c *StructInput) Parse(data []byte, offset int) (int, error) {
	var err error
	c.Address = AccountAddress{}
	offset, err = c.Address.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	var strLen int

	strLen, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	if len(data) < offset+strLen {
		return 0, ErrNotEnoughData
	}
	c.Module = string(data[offset : offset+strLen])
	offset += strLen

	strLen, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	if len(data) < offset+strLen {
		return 0, ErrNotEnoughData
	}
	c.Name = string(data[offset : offset+strLen])
	offset += strLen

	var typeParamsLen int
	typeParamsLen, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	c.TypeParams = make([]TypeInput, typeParamsLen)
	for i := 0; i < typeParamsLen; i++ {
		typeParam := TypeInput{}
		offset, err = typeParam.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		c.TypeParams[i] = typeParam
	}

	return offset, nil
}
