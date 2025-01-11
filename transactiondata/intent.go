package transactiondata

type Intent struct {
	Scope   IntentScope
	Version IntentVersion
	AppId   AppId
}

func (c *Intent) Parse(data []byte, offset int) (int, error) {
	var err error
	offset, err = c.Scope.Parse(data, offset)
	if err != nil {
		return 0, err
	}
	offset, err = c.Version.Parse(data, offset)
	if err != nil {
		return 0, err
	}
	offset, err = c.AppId.Parse(data, offset)
	if err != nil {
		return 0, err
	}
	return offset, nil
}
