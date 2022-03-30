import { useState, useEffect } from 'react'
import { getSealsByUser } from '../helpers/smartSeal'
import { beautifyAddress } from '../helpers/web3Util'

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

const sealImageStyle = {
  height: "250px",
  width: "250px"
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

function MySeals(props) {

  const [mySeals, setMySeals] = useState()

  useEffect(() => {
    async function getAndSetMySeals() {
      let seals = await getSealsByUser(props.user)
      setMySeals(seals)
    }
    getAndSetMySeals()
  }, [props.user]);

  return (
    <>
        <div className={pageHeaderClasses} style={pageHeaderStyle}>
          My SmartSeals:
        </div>

        { mySeals !== undefined
          ? constructSealDisplays(mySeals)
          : null
        }
    </>
  );
}

export default MySeals;
