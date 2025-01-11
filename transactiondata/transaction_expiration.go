package transactiondata

import (
	"encoding/binary"
	"errors"
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
	kind := TransactionExpirationType(data[offset])
	if kind != TransactionExpirationKindNone && kind != TransactionExpirationKindEpoch {
		return 0, errors.New("unknown expiration kind")
	}
	c.Kind = kind
	offset += 1
	if c.Kind == TransactionExpirationKindEpoch {
		if len(data) < offset+8 {
			c.EpochId = binary.LittleEndian.Uint64(data[offset : offset+8])
			offset += 8
		} else {
			return 0, errors.New("data is too short")
		}
	}
	return offset, nil
}
