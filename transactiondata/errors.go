package transactiondata

import "errors"

const (
	ErrNotEnoughDataStr    = "not enough data"
	ErrInvalidEnumValueStr = "invalid enum value"
	ErrNotImplementedStr   = "not implemented"
)

var ErrNotEnoughData error
var ErrInvalidEnumValue error
var ErrNotImplemented error

func init() {
	ErrNotEnoughData = errors.New(ErrNotEnoughDataStr)
	ErrInvalidEnumValue = errors.New(ErrInvalidEnumValueStr)
	ErrNotImplemented = errors.New(ErrNotImplementedStr)
}
