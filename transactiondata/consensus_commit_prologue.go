package transactiondata

import "errors"

type ConsensusCommitPrologue struct {
}

func (c *ConsensusCommitPrologue) ToBytes() []byte {
	return []byte{}
}

func (c *ConsensusCommitPrologue) Parse(data []byte, offset int) (int, error) {
	return 0, errors.New("not implemented")
}
