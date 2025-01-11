package transactiondata

type StructInput struct {
	Address    AccountAddress
	Module     string
	Name       string
	TypeParams []TypeInput
}

/*
pub struct StructInput {
    pub address: AccountAddress,
    pub module: String,
    pub name: String,
    // alias for compatibility with old json serialized data.
    #[serde(rename = "type_args", alias = "type_params")]
    pub type_params: Vec<TypeInput>,
}

*/

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
