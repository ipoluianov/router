package transactiondata

// Publish(Vec<Vec<u8>>, Vec<ObjectID>),

type PublishData struct {
	Data []byte
}

type Publish struct {
	Data      []PublishData
	ObjectIDs []ObjectID
}

func (c *Publish) ToBytes() []byte {
	var data []byte

	// Serialize the number of data
	data = append(data, SerializeULEB128(len(c.Data))...)

	// Serialize the data
	for _, v := range c.Data {
		data = append(data, SerializeULEB128(len(v.Data))...)
		data = append(data, v.Data...)
	}

	// Serialize the number of object IDs
	data = append(data, SerializeULEB128(len(c.ObjectIDs))...)

	// Serialize the object IDs
	for _, v := range c.ObjectIDs {
		data = append(data, v.ToBytes()...)
	}

	return data
}

func (c *Publish) Parse(data []byte, offset int) (int, error) {
	var err error
	var n int
	n, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return offset, err
	}
	c.Data = make([]PublishData, n)
	for i := 0; i < n; i++ {
		var dataSize int
		dataSize, offset, err = ParseULEB128(data, offset)
		if err != nil {
			return offset, err
		}
		if offset+dataSize > len(data) {
			return offset, ErrNotEnoughData
		}
		c.Data[i].Data = make([]byte, dataSize)
		copy(c.Data[i].Data, data[offset:offset+dataSize])
		offset += dataSize
	}

	n, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return offset, err
	}
	c.ObjectIDs = make([]ObjectID, n)
	for i := 0; i < n; i++ {
		offset, err = c.ObjectIDs[i].Parse(data, offset)
		if err != nil {
			return offset, err
		}
	}
	return offset, nil
}
