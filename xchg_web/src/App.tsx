import { ConnectButton, lightTheme, useCurrentAccount, WalletProvider } from "@mysten/dapp-kit";
import { Box, Button, Container, Flex, Heading } from "@radix-ui/themes";
import { Router } from "./Router";
import { Network } from "./Network";
import { Profile } from "./Profile";
import { Fund } from "./Fund";
import { CreateCounter } from "./CreateCounter";
import './customStyles.css'; // Импортируйте ваш CSS файл

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
				<Flex direction='row' align='center' style={{borderBottom: '1px solid #777', marginBottom: '20px'}}>
					<Flex style={styles.logo}>XCHG</Flex>
					<Flex flexGrow='2'>
					</Flex>
					<Flex direction='column'>
						<Button style={styles.link} onClick={() => { window.location.href = '/profile' }}>Profile</Button>
						<Button style={styles.link} onClick={() => { window.location.href = '/address' }}>Address</Button>
					</Flex>
					<Flex direction='column'>
						<Button style={styles.link} onClick={() => { window.location.href = '/network' }}>Network</Button>
						<Button style={styles.link} onClick={() => { window.location.href = '/debug' }}>Debug</Button>
					</Flex>
					<Flex flexGrow='2'>
					</Flex>
					<Box>
						<ConnectButton className="custom-connect-button" />
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
		fontFamily: 'Roboto Mono',
		margin: '6px',
		padding: '6px',
		border: '1px solid #777',
		borderRadius: '5px',
		cursor: 'pointer',
		backgroundColor: '#333',
		color: '#fff',
		width: '100px',
	},
	logo: {
		fontFamily: 'Roboto Mono',
		fontSize: '24pt',
	}
};


export default App;
