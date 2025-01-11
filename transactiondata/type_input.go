package transactiondata

type TypeInput int

const (
	TypeInputBool    TypeInput = 0
	TypeInputU8      TypeInput = 1
	TypeInputU64     TypeInput = 2
	TypeInputU128    TypeInput = 3
	TypeInputAddress TypeInput = 4
	TypeInputSigner  TypeInput = 5
	TypeInputVector  TypeInput = 6
	TypeInputStruct  TypeInput = 7
	TypeInputU16     TypeInput = 8
	TypeInputU32     TypeInput = 9
	TypeInputU256    TypeInput = 10
)

func (c *TypeInput) Parse(data []byte, offset int) (int, error) {
	return 0, ErrNotImplemented
}
