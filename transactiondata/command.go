package transactiondata

type CommandType int

const (
	CommandTypeMoveCall        CommandType = 0
	CommandTypeTransferObjects CommandType = 1
	CommandTypeSplitCoins      CommandType = 2
	CommandTypeMergeCoins      CommandType = 3
	CommandTypePublish         CommandType = 4
	CommandTypeMakeMoveVec     CommandType = 5
	CommandTypeUpgrade         CommandType = 6
)

type Command struct {
	Type CommandType

	MoveCall        *ProgrammableMoveCall
	TransferObjects *TransferObjects
	SplitCoins      *SplitCoins
	MergeCoins      *MergeCoins
	Publish         *Publish
	MakeMoveVec     *MakeMoveVec
	Upgrade         *Upgrade
}

func (c *Command) String() string {
	fundName := ""
	switch c.Type {
	case CommandTypeMoveCall:
		fundName = "MoveCall"
	case CommandTypeTransferObjects:
		fundName = "TransferObjects"
	case CommandTypeSplitCoins:
		fundName = "SplitCoins"
	case CommandTypeMergeCoins:
		fundName = "MergeCoins"
	case CommandTypePublish:
		fundName = "Publish"
	case CommandTypeMakeMoveVec:
		fundName = "MakeMoveVec"
	case CommandTypeUpgrade:
		fundName = "Upgrade"
	}
	return fundName
}

func (c *Command) Parse(data []byte, offset int) (int, error) {
	var kind int
	var err error

	// Parse the command kind
	kind, offset, err = ParseULEB128(data, offset)
	if err != nil {
		return 0, err
	}
	if kind < 0 || kind > 6 {
		return 0, ErrInvalidEnumValue
	}
	c.Type = CommandType(kind)

	// Parse the command data
	switch c.Type {
	case CommandTypeMoveCall:
		c.MoveCall = &ProgrammableMoveCall{}
		offset, err = c.MoveCall.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	case CommandTypeTransferObjects:
		c.TransferObjects = &TransferObjects{}
		offset, err = c.TransferObjects.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	case CommandTypeSplitCoins:
		c.SplitCoins = &SplitCoins{}
		offset, err = c.SplitCoins.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	case CommandTypeMergeCoins:
		c.MergeCoins = &MergeCoins{}
		offset, err = c.MergeCoins.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	case CommandTypePublish:
		c.Publish = &Publish{}
		offset, err = c.Publish.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	case CommandTypeMakeMoveVec:
		c.MakeMoveVec = &MakeMoveVec{}
		offset, err = c.MakeMoveVec.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	case CommandTypeUpgrade:
		c.Upgrade = &Upgrade{}
		offset, err = c.Upgrade.Parse(data, offset)
		if err != nil {
			return 0, err
		}
	}

	return offset, nil
}
