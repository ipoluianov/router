package transactiondata

type ProgrammableMoveCall struct {
	Package       ObjectID
	Module        string
	Function      string
	TypeArguments []TypeInput
	Arguments     []Argument
}

func (c *ProgrammableMoveCall) Parse(data []byte, offset int) (int, error) {
	var err error
	var strLen int

	// Parse PackageID
	c.Package = ObjectID{}
	offset, err = c.Package.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	// Parse Module
	strLen, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	c.Module = string(data[offset : offset+strLen])
	offset += strLen

	// Parse Function
	strLen, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	c.Function = string(data[offset : offset+strLen])
	offset += strLen

	// Parse TypeArguments
	var numTypeArguments int
	numTypeArguments, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	for i := 0; i < numTypeArguments; i++ {
		var typeInput TypeInput
		offset, err = typeInput.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		c.TypeArguments = append(c.TypeArguments, typeInput)
	}

	// Parse Arguments
	var numArguments int
	numArguments, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	for i := 0; i < numArguments; i++ {
		var arg Argument
		offset, err = arg.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		c.Arguments = append(c.Arguments, arg)
	}

	return offset, nil
}
