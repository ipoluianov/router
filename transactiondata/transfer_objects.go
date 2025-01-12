package transactiondata

// TransferObjects(Vec<Argument>, Argument),

type TransferObjects struct {
	Arguments []*Argument
	Argument  *Argument
}

func (c *TransferObjects) ToBytes() []byte {
	var data []byte

	// Serialize the number of arguments
	data = append(data, SerializeULEB128(len(c.Arguments))...)

	// Serialize the arguments
	for _, v := range c.Arguments {
		data = append(data, v.ToBytes()...)
	}

	data = append(data, c.Argument.ToBytes()...)

	return data
}

func (c *TransferObjects) Parse(data []byte, offset int) (int, error) {
	var err error
	c.Arguments = make([]*Argument, 0)
	var sizeOfArguments int
	sizeOfArguments, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	for i := 0; i < sizeOfArguments; i++ {
		argument := &Argument{}
		offset, err = argument.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		c.Arguments = append(c.Arguments, argument)
	}
	c.Argument = &Argument{}
	offset, err = c.Argument.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	return offset, nil
}
