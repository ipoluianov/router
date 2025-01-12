package transactiondata

func SerializeULEB128(value int) []byte {
	var data []byte
	for {
		b := byte(value & 0x7f)
		value >>= 7
		if value != 0 {
			b |= 0x80
		}
		data = append(data, b)
		if value == 0 {
			break
		}
	}
	return data
}

func ParseULEB128(data []byte, offset int) (int, int, error) {
	var result uint64
	var shift uint
	for {
		if len(data) <= offset {
			return 0, 0, ErrNotEnoughData
		}
		b := data[offset]
		offset++
		result |= uint64(b&0x7f) << shift
		if b&0x80 == 0 {
			break
		}
		shift += 7
	}
	return int(result), offset, nil
}
