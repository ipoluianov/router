package transactiondata

type SplitCoins struct {
	Argument  *Argument
	Arguments []*Argument
}

func (c *SplitCoins) ToBytes() []byte {
	var data []byte

	// Serialize the argument
	data = append(data, c.Argument.ToBytes()...)

	// Serialize the number of arguments
	data = append(data, SerializeULEB128(len(c.Arguments))...)

	// Serialize the arguments
	for _, v := range c.Arguments {
		data = append(data, v.ToBytes()...)
	}

	return data
}

func (c *SplitCoins) Parse(data []byte, offset int) (int, error) {
	var err error
	c.Argument = &Argument{}
	offset, err = c.Argument.Parse(data, offset)
	if err != nil {
		return 0, err
	}
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

	return offset, nil
}
