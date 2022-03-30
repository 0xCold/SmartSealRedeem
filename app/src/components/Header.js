import { getAccounts, beautifyAddress } from "../helpers/web3Util"

const headerClasses = "row"
const headerStyle = {
    backgroundColor: "black",
    color: "white"
}

const logoClasses = "col d-flex text-center justify-content-center align-items-center"
const logoStyle = {
    fontSize: "2vw",
    cursor: "pointer"
}

const tabClasses = "col d-flex text-center justify-content-center align-items-center"
const tabStyle = {
    fontSize: "1.2vw",
    cursor: "pointer"
}

const currentTabStyle = {
    fontSize: "1.2vw",
    textDecoration: "underline",
    cursor: "pointer"
}

const walletButtonClasses = "col"
const walletButtonStyle = {
    backgroundColor: "skyblue",
    color: "black",
    borderRadius: "15px"
}

async function tryConnectWallet(user, setUser) {
    if (user === undefined) {
        let accounts = await getAccounts()
        setUser(accounts[0])
    }
    return user
}

function constructTabs() {

}

function Header(props) {
    return (
        <div className={headerClasses} style={headerStyle}>

            <
                div className={logoClasses} 
                style={logoStyle}
            >
                SmartSeal
            </div>

            <div 
                className={tabClasses} 
                style={props.page === 'Home' ? currentTabStyle: tabStyle}
                onClick={() => props.setPage('Home')}
            >
                Home
            </div>
            
            <div 
                className={tabClasses} 
                style={props.page === 'Redeem' ? currentTabStyle: tabStyle}
                onClick={() => props.setPage('Redeem')}
            >
                Redeem
            </div>

            <div 
                className={tabClasses} 
                style={props.page === 'My Seals' ? currentTabStyle: tabStyle}
                onClick={() => props.setPage('My Seals')}
            >
                My Seals
            </div>

            <div 
                className={ tabClasses } 
                style={ props.page === 'Admins' ? currentTabStyle: tabStyle }
                onClick={ () => props.setPage('Admins') }
            >
                Admins
            </div>

            <div className={ tabClasses } style={ tabStyle }>
                <button
                    className={ walletButtonClasses }
                    style={ walletButtonStyle }
                    onClick={ () => tryConnectWallet(props.user, props.setUser) }
                >
                    { props.user !== undefined 
                        ? beautifyAddress(props.user) 
                        : "Connect" 
                    }
                </button>
            </div>
        </div>
    );
}

export default Header;
