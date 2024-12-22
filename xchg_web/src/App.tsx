import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { useState } from "react";
import { Counter } from "./Counter";
import { Payment } from "./Payment";
import { Router } from "./Router";
import { Network } from "./Network";
import { Profile } from "./Profile";
import { Fund } from "./Fund";
import { CreateCounter } from "./CreateCounter";

function App() {
	const currentAccount = useCurrentAccount();
	const [counterId, setCounter] = useState(() => {
		const hash = window.location.hash.slice(1);
		return isValidSuiObjectId(hash) ? hash : null;
	});

	return (
		<>
			<Flex
				position="sticky"
				px="4"
				py="2"
				justify="between"
				style={{
					borderBottom: "1px solid var(--gray-a2)",
				}}
			>
				<Box>
					<Heading><a href="/">SUI Notes</a></Heading>
				</Box>
				<Box>
					<a href="/profile">Profile</a>
				</Box>
				<Box>
					<a href="/address">Address</a>
				</Box>
				<Box>
					<a href="/network">Network</a>
				</Box>
				<Box>
					<ConnectButton />
				</Box>
			</Flex>
			<Container>
				<Container
					mt="5"
					pt="2"
					px="4"
					style={{ background: "var(--gray-a2)", minHeight: 500 }}
				>
					<CreateCounter />
					<Fund />
					<Profile />
					<Router />
					
					{currentAccount ? (
						<Heading></Heading>
					) : (
						<Heading>Please connect your wallet</Heading>
					)
					}
				</Container>
			</Container>
		</>
	);
}

export default App;
