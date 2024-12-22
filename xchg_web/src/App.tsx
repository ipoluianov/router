import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { Router } from "./Router";
import { Network } from "./Network";
import { Profile } from "./Profile";
import { Fund } from "./Fund";
import { CreateCounter } from "./CreateCounter";

function App() {
	const currentAccount = useCurrentAccount();
	console.log('APP: currentAccount', currentAccount);
	const path = window.location.pathname;
	let content;
	if (currentAccount != null) {

		if (path === '/' || path === '/profile') {
			content = <Profile currentAccount={currentAccount} key='profile' />;
		}

		if (path === '/address') {
			content = <Router />;
		}

		if (path === '/debug') {
			content = <>
				<CreateCounter />
				<Fund />
				<Profile currentAccount={currentAccount} />
				<Router />
			</>;
		}

		if (path === '/network') {
			content = <Network />;
		}
	}

	return (
		<>
			<Flex
				position="sticky"
				px="4"
				py="2"
				justify="between"
				style={{
					borderBottom: "1px solid var(--gray-a2)",
					backgroundColor: '#EEFF00',
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
					<a href="/debug">DEBUG</a>
				</Box>
				<Box>
					<ConnectButton />
				</Box>
			</Flex>
			<Container>
				<Container>
					{content}
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
