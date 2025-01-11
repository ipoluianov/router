package transactiondata

type TransactionDataV1 struct {
	Kind       *TransactionKind
	Sender     *SuiAddress
	GasData    *GasData
	Expiration *TransactionExpiration
}

// 0000010101261fb14f034bf488b8bfdeb263f081b5073883269368e258852f34deeae205d2709e2a1c00000000010100be66e3956632c8b8cb90211ecb329b9bb03afef9ba5d72472a7c240d3afe19fd0466756e6403657832000101000024789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c647660172270e5d67cf2e1d87d864feac1a5db9bc26eee39b034e124437c65ff04a1dd70b98e21a00000000204e0d868967368a5220200500345a7dfe8d756ee563d1220168171584d417861d24789498deeb4b84c73e58554a73912a2c6a2358905903ac68f9a72818c64766ee0200000000000000e1f5050000000000

func (c *TransactionDataV1) Parse(data []byte, offset int) (int, error) {
	var err error
	c.Kind = &TransactionKind{}
	c.Sender = &SuiAddress{}
	c.GasData = &GasData{}
	c.Expiration = &TransactionExpiration{}

	offset, err = c.Kind.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	offset, err = c.Sender.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	offset, err = c.GasData.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	offset, err = c.Expiration.Parse(data, offset)
	if err != nil {
		return 0, err
	}

	return offset, nil
}
