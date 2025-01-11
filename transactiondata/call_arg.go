package transactiondata

import "errors"

type CallArgType int

const (
	CallArgTypePure   CallArgType = 0
	CallArgTypeObject CallArgType = 1
)

type CallArg struct {
	Pure   []byte
	Object *ObjectArg
}

func (c *CallArg) Parse(data []byte, offset int) (int, error) {
	if len(data) < offset+1 {
		return 0, errors.New("not enough data")
	}
	argType := CallArgType(data[offset])
	if argType != CallArgTypePure && argType != CallArgTypeObject {
		return 0, errors.New("unknown arg type")
	}

	offset++

	switch argType {
	case CallArgTypePure:
		if len(data) < offset+1 {
			return 0, errors.New("not enough data")
		}
		pureLen := int(data[offset])
		offset++
		if len(data) < offset+pureLen {
			return 0, errors.New("not enough data")
		}
		c.Pure = make([]byte, pureLen)
		copy(c.Pure, data[offset:offset+pureLen])
		offset += pureLen
	case CallArgTypeObject:
		c.Object = &ObjectArg{}
		n, err := c.Object.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		offset += n
	default:
		return 0, errors.New("unknown arg type")
	}
	return offset, nil
}
