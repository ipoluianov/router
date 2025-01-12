package transactiondata

type ObjectArgType int

const (
	ObjectArgTypeImmOrOwnedObject ObjectArgType = 0
	ObjectArgTypeSharedObject     ObjectArgType = 1
	ObjectArgTypeReceiving        ObjectArgType = 2
)

type ObjectArg struct {
	Type ObjectArgType

	ImmOrOwnedObject *ObjectRef
	SharedObject     *SharedObject
	Receiving        *ObjectRef
}

func (c *ObjectArg) ToBytes() []byte {
	var data []byte

	// Serialize the type of the object argument
	data = append(data, SerializeULEB128(int(c.Type))...)

	// Serialize the object argument
	switch c.Type {
	case ObjectArgTypeImmOrOwnedObject:
		// Serialize the immediate or owned object
		data = append(data, c.ImmOrOwnedObject.ToBytes()...)
	case ObjectArgTypeSharedObject:
		// Serialize the shared object
		data = append(data, c.SharedObject.ToBytes()...)
	case ObjectArgTypeReceiving:
		// Serialize the receiving object
		data = append(data, c.Receiving.ToBytes()...)
	default:
		return nil
	}

	return data
}

func (c *ObjectArg) Parse(data []byte, offset int) (int, error) {
	var err error

	// Parse the type of the object argument
	var argType int
	argType, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	if argType < 0 || argType > 2 {
		return 0, ErrInvalidEnumValue
	}
	c.Type = ObjectArgType(argType)

	switch c.Type {
	case ObjectArgTypeImmOrOwnedObject:
		// Parse the immediate or owned object
		c.ImmOrOwnedObject = &ObjectRef{}
		offset, err = c.ImmOrOwnedObject.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	case ObjectArgTypeSharedObject:
		// Parse the shared object
		c.SharedObject = &SharedObject{}
		offset, err = c.SharedObject.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	case ObjectArgTypeReceiving:
		// Parse the receiving object
		c.Receiving = &ObjectRef{}
		offset, err = c.Receiving.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	default:
		return 0, ErrInvalidEnumValue
	}

	return offset, nil
}
