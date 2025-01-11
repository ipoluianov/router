package transactiondata

import "encoding/binary"

type ArgumentType int

const (
	ArgumentTypeGasCoin      ArgumentType = 0
	ArgumentTypeInput        ArgumentType = 1
	ArgumentTypeResult       ArgumentType = 2
	ArgumentTypeNestedResult ArgumentType = 3
)

type ArgumentInput uint16
type ArgumentResult uint16
type ArgumentNestedResult struct {
	Index1 uint16
	Index2 uint16
}

type Argument struct {
	ArgumentType         ArgumentType
	ArgumentInput        ArgumentInput
	ArgumentResult       ArgumentResult
	ArgumentNestedResult ArgumentNestedResult
}

func (c *Argument) Parse(data []byte, offset int) (int, error) {
	var err error
	var arg int
	arg, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	if arg < 0 || arg > 3 {
		return 0, ErrInvalidEnumValue
	}
	c.ArgumentType = ArgumentType(arg)
	switch c.ArgumentType {
	case ArgumentTypeGasCoin:
	case ArgumentTypeInput:
		if len(data) < offset+2 {
			return 0, ErrNotEnoughData
		}
		c.ArgumentInput = ArgumentInput(binary.LittleEndian.Uint16(data[offset:]))
		offset += 2
	case ArgumentTypeResult:
		if len(data) < offset+2 {
			return 0, ErrNotEnoughData
		}
		c.ArgumentResult = ArgumentResult(binary.LittleEndian.Uint16(data[offset:]))
		offset += 2
	case ArgumentTypeNestedResult:
		if len(data) < offset+4 {
			return 0, ErrNotEnoughData
		}
		c.ArgumentNestedResult.Index1 = binary.LittleEndian.Uint16(data[offset:])
		offset += 2
		c.ArgumentNestedResult.Index2 = binary.LittleEndian.Uint16(data[offset:])
		offset += 2
	}
	return offset, nil
}
