package transactiondata

// MakeMoveVec(Option<TypeInput>, Vec<Argument>),

type MakeMoveVec struct {
}

func (c *MakeMoveVec) Parse(data []byte, offset int) (int, error) {
	return 0, ErrNotImplemented
}
