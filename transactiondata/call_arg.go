package transactiondata

type CallArgType int

const (
	CallArgTypePure   CallArgType = 0
	CallArgTypeObject CallArgType = 1
)

type CallArg struct {
	Type CallArgType

	Pure   []byte
	Object *ObjectArg
}

func (c *CallArg) ToBytes() []byte {
	var data []byte

	// Serialize the type of the argument
	data = append(data, SerializeULEB128(int(c.Type))...)

	// Serialize the argument
	switch c.Type {
	case CallArgTypePure:
		// Serialize the length of the pure data
		data = append(data, SerializeULEB128(len(c.Pure))...)
		// Serialize the pure data
		data = append(data, c.Pure...)
	case CallArgTypeObject:
		// Serialize the object
		data = append(data, c.Object.ToBytes()...)
	default:
		return nil
	}

	return data
}

func (c *CallArg) Parse(data []byte, offset int) (int, error) {
	var err error

	// Read type of the argument
	var argType int
	argType, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	if argType < 0 || argType > 1 {
		return 0, ErrInvalidEnumValue
	}
	c.Type = CallArgType(argType)

	// Make and parse the argument
	switch c.Type {
	case CallArgTypePure:
		// Read the length of the pure data
		var pureLen int
		pureLen, offset, err = ParseULEB128(data, offset)
		if err != nil {
			return 0, err
		}
		if len(data) < offset+pureLen {
			return 0, ErrNotEnoughData
		}
		// Copy the pure data
		c.Pure = make([]byte, pureLen)
		copy(c.Pure, data[offset:offset+pureLen])
		offset += pureLen
	case CallArgTypeObject:
		// Parse the object
		c.Object = &ObjectArg{}
		offset, err = c.Object.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	default:
		return 0, ErrInvalidEnumValue
	}
	return offset, nil
}
