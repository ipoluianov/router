package transactiondata

import "errors"

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

func (c *ObjectArg) Parse(data []byte, offset int) (int, error) {
	if len(data) < offset+1 {
		return 0, errors.New("not enough data")
	}
	argType := ObjectArgType(data[offset])
	offset++
	if argType < 0 || argType > 2 {
		return 0, errors.New("invalid arg type")
	}
	c.Type = argType
	switch argType {
	case ObjectArgTypeImmOrOwnedObject:
		c.ImmOrOwnedObject = &ObjectRef{}
		n, err := c.ImmOrOwnedObject.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		offset += n
	case ObjectArgTypeSharedObject:
		c.SharedObject = &SharedObject{}
		n, err := c.SharedObject.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		offset += n
	case ObjectArgTypeReceiving:
		c.Receiving = &ObjectRef{}
		n, err := c.Receiving.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		offset += n
	}

	return offset, nil
}
