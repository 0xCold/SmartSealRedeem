import { useState } from 'react'
import { redeemSeal } from '../helpers/smartSeal'
import { inputOnFocus, inputOnBlur, extractRawPayload } from '../helpers/helpers'

const pageHeaderClasses = "row text-center justify-content-center"
const pageHeaderStyle = {
    color: "black",
    fontSize: "2.5vw"
}

const pageSubHeaderClasses = "row text-center justify-content-center"
const pageSubHeaderStyle = {
    color: "black",
    fontSize: "1.5vw"
}

const redeemButtonStyle = {
    backgroundColor: "orange",
    color: "black",
    borderRadius: "5px"
}

const defaultPin = "PIN #"

function assertPinValid(pin) {
    return pin.length === 8
}

function safeUpdatePin(input) {
    return input.value.toUpperCase()
}

function Redeem(props) {

  const [pin, setPin] = useState(defaultPin)

  return (
    <>
        <div className={pageHeaderClasses} style={pageHeaderStyle}>
            Redeem a SmartSeal NFT:
        </div>

        <div className={pageSubHeaderClasses} style={pageSubHeaderStyle}>
            Current Payload: { extractRawPayload(window.location.href) }
        </div>

        <div className="row text-center justify-content-center py-1">
            <input 
                id="pin-input"
                className="mx-1"
                type="text" 
                onFocus={ e => inputOnFocus(e.target, defaultPin) }   
                onBlur={ e => inputOnBlur(e.target, defaultPin) }
                onChange={ e => setPin(safeUpdatePin(e.target)) }
                value={ pin }
                maxLength="8" 
            />
            <button 
                className="mx-1"
                style={ redeemButtonStyle }
                disabled={ !assertPinValid(pin) }
                onClick={ () => redeemSeal(props.user, pin, extractRawPayload(window.location.href)) }
            > 
                Redeem 
            </button>
        </div>
    </>
  );
}

export default Redeem;
