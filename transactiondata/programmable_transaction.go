package transactiondata

import "errors"

type ProgrammableTransaction struct {
	Inputs   []*CallArg
	Commands []*Command
}

func (c *ProgrammableTransaction) Parse(data []byte, offset int) (int, error) {
	if len(data) < offset+1 {
		return 0, errors.New("not enough data")
	}
	numInputs := int(data[offset])
	offset++
	for i := 0; i < numInputs; i++ {
		arg := &CallArg{}
		n, err := arg.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		offset += n
		c.Inputs = append(c.Inputs, arg)
	}

	if len(data) < offset+1 {
		return 0, errors.New("not enough data")
	}

	numCommands := int(data[offset])
	offset++
	for i := 0; i < numCommands; i++ {
		cmd := &Command{}
		n, err := cmd.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		offset += n
		c.Commands = append(c.Commands, cmd)
	}
	return 0, errors.New("not implemented")
}
