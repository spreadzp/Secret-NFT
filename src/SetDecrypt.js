import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { decryptPrivateKey, decryptUriFile } from "./metamask";

const SetDecrypt = props => {

    const { drizzle, drizzleState, encData, encPrivateKey, typeData, showDialod } = props;
    const [encryptedInfo, setEncryptedInfo] = useState('');
    const [decryptedPK, setDecryptedPK] = useState('');
    const [decryptedInfo, setDecryptedInfo] = useState('');
    const [decPk, setDecPk] = useState(false);
    const [decInfoShow, setDecInfoShow] = useState(false);
    const { register, handleSubmit, watch, errors } = useForm();

    useEffect(() => {
        setEncryptedInfo(encData);
    }, [encData]);

    useEffect(() => {
        if (decPk) {
            async function getDecryptMessage() {
                if (encPrivateKey !== '') {
                    const dm = await decryptPrivateKey(encPrivateKey, drizzleState.accounts[0]);
                    console.log("🚀 ~ file: SetDecrypt.js ~ line 20 ~ decryptMessage ~ decMessage", dm)
                    setDecryptedPK(dm)
                    setDecInfoShow(true)
                }
            }
            getDecryptMessage()

        }
    }, [decPk, encPrivateKey]);

    useEffect(() => {
        if (decryptedPK && encData) {
            async function getDecryptMessage() {
                const dm = await decryptUriFile(encData, decryptedPK);
                setDecryptedInfo(dm)

            }
            getDecryptMessage()

        }
    }, [decryptedPK, encData]);

    // const onFileChange = (event) => {
    //     let file = event.target.files[0];

    //     let fileReader = new FileReader();
    //     fileReader.readAsText(file);

    //     fileReader.onload = (event) => {
    //         let fileAsText = event.target.result;
    //         setEncryptedInfo(fileAsText);
    //     };
    // };

    const showDecryptByTypeData = (type) => {
        return (
            <>
                {type == '0' && <div name="decrypredData"
                    className="u-full-width">{decryptedInfo}</div>}
                {type == '1' && <div><img name="decrypredData"
                    className="u-full-width" src={decryptedInfo} />
                </div>}
            </>
        )
    }

    return (
        <section>
            <div className="row">
                <div className="six columns">
                    <label htmlFor="decrypredData">Encrypted Data</label>
                    {showDecryptByTypeData(typeData)}

                </div>
            </div>
            <button onClick={() => setDecPk(!decPk)} >Decrypt Data</button>
            <button onClick={() => showDialod(false)} >close</button>
        </section>
    );
};
export default SetDecrypt;
