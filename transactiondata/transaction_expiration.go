package transactiondata

import (
	"encoding/binary"
)

type TransactionExpirationType int

const (
	TransactionExpirationKindNone  TransactionExpirationType = 0
	TransactionExpirationKindEpoch TransactionExpirationType = 1
)

type TransactionExpiration struct {
	Kind    TransactionExpirationType
	EpochId uint64
}

func (c *TransactionExpiration) Parse(data []byte, offset int) (int, error) {
	var kind int
	var err error

	kind, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	if kind < 0 || kind > 1 {
		return 0, ErrInvalidEnumValue
	}

	c.Kind = TransactionExpirationType(kind)

	if c.Kind == TransactionExpirationKindEpoch {
		if offset+8 > len(data) {
			return 0, ErrNotEnoughData
		}
		c.EpochId = binary.LittleEndian.Uint64(data[offset : offset+8])
		offset += 8
	}
	return offset, nil
}
