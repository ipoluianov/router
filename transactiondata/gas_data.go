package transactiondata

import (
	"encoding/binary"
	"fmt"
)

type GasData struct {
	Payment []ObjectRef
	Owner   SuiAddress
	Price   uint64
	Budget  uint64
}

func (c *GasData) String() string {
	result := "GasData { Payment: ["
	for i, ref := range c.Payment {
		result += ref.String()
		if i < len(c.Payment)-1 {
			result += ", "
		}
	}
	result += "], Owner: " + c.Owner.String() + ", Price: " + fmt.Sprint(c.Price) + ", Budget: " + fmt.Sprint(c.Budget) + " }"
	return result
}

func (c *GasData) Parse(data []byte, offset int) (int, error) {
	var numPayments int
	var err error

	numPayments, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}

	for i := 0; i < numPayments; i++ {
		var ref ObjectRef
		offset, err = ref.Parse(data, offset)
		if err != nil {
			return 0, err
		}
		c.Payment = append(c.Payment, ref)
	}

	offset, err = c.Owner.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	// Parse price
	if len(data) < offset+8 {
		return 0, ErrNotEnoughData
	}
	c.Price = binary.LittleEndian.Uint64(data[offset : offset+8])
	offset += 8

	// Parse budget
	if len(data) < offset+8 {
		return 0, ErrNotEnoughData
	}
	c.Budget = binary.LittleEndian.Uint64(data[offset : offset+8])
	offset += 8

	return offset, nil
}
