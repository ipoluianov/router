package transactiondata

type ProgrammableTransaction struct {
	Inputs   []*CallArg
	Commands []*Command
}

func (c *ProgrammableTransaction) ToBytes() []byte {
	var data []byte

	// Serialize the number of inputs
	data = append(data, SerializeULEB128(len(c.Inputs))...)

	// Serialize the inputs
	for _, v := range c.Inputs {
		data = append(data, v.ToBytes()...)
	}

	// Serialize the number of commands
	data = append(data, SerializeULEB128(len(c.Commands))...)

	// Serialize the commands
	for _, v := range c.Commands {
		data = append(data, v.ToBytes()...)
	}

	return data
}

func (c *ProgrammableTransaction) Parse(data []byte, offset int) (int, error) {
	var numInputs int
	var numCommands int
	var err error

	numInputs, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}

	for i := 0; i < numInputs; i++ {
		arg := &CallArg{}
		offset, err = arg.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		c.Inputs = append(c.Inputs, arg)
	}

	numCommands, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}

	for i := 0; i < numCommands; i++ {
		cmd := &Command{}
		offset, err = cmd.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		c.Commands = append(c.Commands, cmd)
	}
	return offset, nil
}
