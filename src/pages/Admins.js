import { useState, useEffect } from 'react'
import { getAllSeals, createSeal, flipPausedStatus } from '../helpers/smartSeal'
import { beautifyAddress } from '../helpers/web3Util'
import { inputOnFocus, inputOnBlur } from '../helpers/helpers'

const defaultAuthority = "Authority Address"
const defaultUri = "URI Suffix"

const pageHeaderClasses = "row text-center justify-content-center"
const pageHeaderStyle = {
    color: "black",
    fontSize: "2.5vw"
}

const sealDisplayClasses = "col text-center justify-content-center m-2"
const sealDisplayStyle = {
    backgroundColor: "black",
    borderRadius: "10px",
    color: "white",
    fontSize: "1.75vw",
    maxWidth: "25%"
}

const createButtonStyle = {
    backgroundColor: "orange",
    color: "black",
    borderRadius: "5px"
}


const sealImageStyle = {
    height: "250px",
    width: "250px"
  }

function assertAuthorityValid(authority) {
    return authority.length === 42
}

function safeUpdateAuthority(input) {
    return input.value
}

function constructSealDisplays(seals) {
    let sealDisplays = [];
    for (let seal of seals) {
        sealDisplays.push(
            <div className={ sealDisplayClasses } style={ sealDisplayStyle }>
                <div className="row text-center justify-content-center">
                    SmartSeal #{ seal.id }
                </div>
                <div className="row text-center justify-content-center">
                    <img 
                        src={ "seals/" + seal.uri }
                        alt={ "SmartSeal NFT" + seal.id } 
                        style={ sealImageStyle }
                    />
                </div>
                <div className="row text-center justify-content-center">
                    URI: { seal.uri }
                </div>
                <div className="row text-center justify-content-center">
                    Authority: { beautifyAddress(seal.authority) }
                </div>
                <div className="row text-center justify-content-center">
                    Redeemed?: { seal.redeemed ? "Yes" : "No" }
                </div>
            </div>
        )
    }
    return (
        <div className="row">
            { sealDisplays }
        </div>
    );
}

function Admins(props) {
  const [authority, setAuthority] = useState(defaultAuthority)
  const [uri, setUri] = useState(defaultUri)
  const [seals, setSeals] = useState()

  useEffect(() => {
    async function getAndSetSeals() {
      let seals = await getAllSeals()
      setSeals(seals)
    }
    getAndSetSeals()
  }, [props.user]);

  return (
    <>
        <div className={pageHeaderClasses} style={pageHeaderStyle}>
            Flip Contract Pause Status:
        </div>

        <div className="row text-center justify-content-center py-1">
            <button 
                style={ createButtonStyle }
                onClick={ () => flipPausedStatus(props.user) }
            > 
                Pause 
            </button>
        </div>

        <div className={pageHeaderClasses} style={pageHeaderStyle}>
            Create a SmartSeal NFT:
        </div>

        <div className="row text-center justify-content-center py-1">
            <input 
                id="authority-input"
                className="mx-1"
                type="text" 
                onFocus={e => inputOnFocus(e.target, defaultAuthority)}   
                onBlur={e => inputOnBlur(e.target, defaultAuthority)}
                onChange={e => setAuthority(safeUpdateAuthority(e.target))}
                value={authority}
            />

            <input 
                id="uri-input"
                className="mx-1"
                type="text" 
                onFocus={e => inputOnFocus(e.target, defaultUri )}   
                onBlur={e => inputOnBlur(e.target, defaultUri)}
                onChange={e => setUri(e.target.value)}
                value={uri}
            />

            <button 
                className="mx-1"
                style={ createButtonStyle }
                disabled={ !assertAuthorityValid(authority) }
                onClick={ () => createSeal(props.user, authority, uri) }
            > 
                Create 
            </button>
        </div>

        <div className={pageHeaderClasses} style={pageHeaderStyle}>
            All SmartSeal NFTs:
        </div>

        { seals !== undefined
            ? constructSealDisplays(seals)
            : null
        }
    </>
  );
}

export default Admins;
