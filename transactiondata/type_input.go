package transactiondata

type TypeInput struct {
	Type            TypeInputType
	VectorTypeInput *TypeInput
	StructInput     *StructInput
}

type TypeInputType int

const (
	TypeInputBool    TypeInputType = 0
	TypeInputU8      TypeInputType = 1
	TypeInputU64     TypeInputType = 2
	TypeInputU128    TypeInputType = 3
	TypeInputAddress TypeInputType = 4
	TypeInputSigner  TypeInputType = 5
	TypeInputVector  TypeInputType = 6
	TypeInputStruct  TypeInputType = 7
	TypeInputU16     TypeInputType = 8
	TypeInputU32     TypeInputType = 9
	TypeInputU256    TypeInputType = 10
)

/*
pub enum TypeInput {
    // alias for compatibility with old json serialized data.
    #[serde(rename = "bool", alias = "Bool")]
    Bool,
    #[serde(rename = "u8", alias = "U8")]
    U8,
    #[serde(rename = "u64", alias = "U64")]
    U64,
    #[serde(rename = "u128", alias = "U128")]
    U128,
    #[serde(rename = "address", alias = "Address")]
    Address,
    #[serde(rename = "signer", alias = "Signer")]
    Signer,
    #[serde(rename = "vector", alias = "Vector")]
    Vector(Box<TypeInput>),
    #[serde(rename = "struct", alias = "Struct")]
    Struct(Box<StructInput>),

    // NOTE: Added in bytecode version v6, do not reorder!
    #[serde(rename = "u16", alias = "U16")]
    U16,
    #[serde(rename = "u32", alias = "U32")]
    U32,
    #[serde(rename = "u256", alias = "U256")]
    U256,
}

*/

func (c *TypeInput) Parse(data []byte, offset int) (int, error) {
	tpInput, offset, err := ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	if tpInput < 0 || tpInput > 10 {
		return 0, ErrInvalidEnumValue
	}
	c.Type = TypeInputType(tpInput)
	if c.Type == TypeInputVector {
		c.VectorTypeInput = &TypeInput{}
		offset, err = c.VectorTypeInput.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	}
	if c.Type == TypeInputStruct {
		c.StructInput = &StructInput{}
		offset, err = c.StructInput.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	}
	return offset, nil
}
