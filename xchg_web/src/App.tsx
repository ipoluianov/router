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
		<Flex direction='column' align='center'>
			<Flex maxWidth='600px' minWidth='600px' direction='column'>
				<Flex direction='row' align='center' >
					<Flex direction='column'>
						<a style={styles.link} href="/profile">Profile</a>
						<a style={styles.link} href="/address">Address</a>
					</Flex>
					<Flex direction='column'>
						<a style={styles.link} href="/network">Network</a>
						<a style={styles.link} href="/debug">DEBUG</a>
					</Flex>
					<Flex flexGrow='2'>
					</Flex>
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
			</Flex>
		</Flex>
	);
}

const styles: Record<string, React.CSSProperties> = {
    link: {
        margin: '6px',
		color: '#007BFF',
    },
};


export default App;
