import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Table } from 'react-bootstrap';
import { decryptPrivateKey, decryptUriFile } from "./metamask";
import { create } from 'ipfs-http-client'
import SetDecrypt from "./SetDecrypt";
const client = create('https://ipfs.infura.io:5001/api/v0')

const OwnerAssets = props => {

    const { drizzle, drizzleState} = props;
    const [sellerSoldAmounts, setSellerSoldAmounts] = useState([]);
    const [encryptedPrivateKey, setEncryptedPrivateKey] = useState('');
    const [decryptedInfo, setDecryptedInfo] = useState('');
    const [encData, setEncData] = useState('');
    const [showDecryptModule, setShowDecryptModule] = useState(false);

    const [typeData, setTypeData] = useState(0)
    const [choosedToken, setChoosedToken] = useState(null)
    const contract = drizzle.contracts.EncNft;

    const contractMarket = drizzle.contracts.MarketPlace;
    const typeFileNames = ['#text', '#image', '#qr']

    

    useEffect(() => {
        async function countOfTokens() {
            const result = await contract.methods
                .getIdsByAddress(drizzleState.accounts[0])
                .call({ from: drizzleState.accounts[0] });
            console.log('result   ', result);
            if (result && result.length) {

                Promise.all(
                    result.map(async (id) => {
                        const soldBalance = await contractMarket.methods
                            .getOwnerInfo(id, drizzleState.accounts[0])
                            .call({ from: drizzleState.accounts[0] });

                        const currentOwnerInfo = await contract.methods.getTokenInfoLastOwner(id).call({ from: drizzleState.accounts[0] });
                        console.log(id, "🚀 ~ file: OwnerAssets.js ~ line 42 ~ result.map ~  currentOwnerInfo", currentOwnerInfo.encData, currentOwnerInfo.owner)

                        const uriInfo = await contract.methods.tokenURI(id).call({ from: drizzleState.accounts[0] });

                        const parsedUri = JSON.parse(uriInfo)
                        console.log("🚀 ~ file: OwnerAssets.js ~ line 48 ~ result.map ~ parsedUri", parsedUri)
                        setSellerSoldAmounts(sellerSoldAmounts => [...sellerSoldAmounts, { idToken: id, balance: soldBalance, currentOwner: currentOwnerInfo.owner, encPrivateKey: currentOwnerInfo.encData, ...parsedUri }])
                    })
                )
            }
            console.log('sellerSoldAmounts :>> ', sellerSoldAmounts);
        }
        countOfTokens()
    }, [])

    useEffect(() =>{
        if(choosedToken) {
            const path = choosedToken.image.split('/')
            const cidPath = path[path.length - 1]
            console.log("🚀 ~ file: OwnerAssets.js ~ line 60 ~ useEffect ~ cidPath", cidPath)
            const getInfoFromIPFS = async (cid) => {
                const result = await client.object.get(cid, { timeout: 30000 })
                const string = new TextDecoder().decode(result.Data).slice(0, -4);
                const cuttedString = string.slice(6)
                console.log("🚀 ~ file: OwnerAssets.js ~ line 66 ~ getInfoFromIPFS ~ cuttedString", cuttedString)
                setEncData(cuttedString)

            }
            getInfoFromIPFS(cidPath)
        }
        

    }, [choosedToken])
    

    const withdrawSum = async (idToken) => {

        const resultWithdraw = await contractMarket.methods.sellerWithdrawSum(idToken).send({
            from: drizzleState.accounts[0],
            gasPrice: 5 * 10 ** 10, gasLimit: 400000
        })
        console.log("🚀 ~ file: OwnerAssets.js ~ line 57 ~ result ~ result", resultWithdraw)
    };

    const getTypeDataFromDescription = (description) => {
        console.log("🚀 ~ file: OwnerAssets.js ~ line 78 ~ getTypeDataFromDescription ~ description", description)
        typeFileNames.map((name, ind) => {

            if (description.includes(name)) {
                console.log("🚀 ~ file: OwnerAssets.js ~ line 80 ~ typeFileNames.map ~ ind", ind)
                console.log("🚀 ~ file: OwnerAssets.js ~ line 81 ~ typeFileNames.map ~ name", name)

                setTypeData(ind)
            }
        })
    }

    const decryptInfo = async (token) => {
        console.log("🚀 ~ file: OwnerAssets.js ~ line 85 ~ decryptInfo ~ token", token)
        if (!choosedToken || choosedToken !== token || showDecryptModule) {
            setChoosedToken(token)
            setShowDecryptModule(true)
        }
    }
    useEffect(() => {
 
        if (choosedToken && choosedToken.encPrivateKey !== encryptedPrivateKey)  {
            setEncryptedPrivateKey(choosedToken.encPrivateKey)
            getTypeDataFromDescription(choosedToken.description)

            setShowDecryptModule(true)
            console.log('typeData :>> ', typeData);
            console.log('encryptedPrivateKey  :>> ', encryptedPrivateKey);
        } 


    }, [decryptInfo, choosedToken, showDecryptModule])


    const compareAddresses = (add1, add2) => {
        return add1 === add2
    }

    const callbackFromDecrypt = (flag) => {
        setShowDecryptModule(flag)
    }

    // const showDecryptByTypeData = (type) => {
    //     return (
    //         <>
    //             {type === 0 && <div name="decrypredData"
    //                 className="u-full-width">{decryptedInfo}</div>}
    //             {type === 1 && <img name="decrypredData"
    //                 className="u-full-width" src={decryptedInfo} />}
    //         </>
    //     )
    // }

    return (
        <section>
            <h2>Your assets</h2>
            <h3>Sold tokens </h3>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID NFT</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Sum</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        sellerSoldAmounts.map((token, i) =>
                        (<tr key={i}>
                            <td>{token.idToken}</td>
                            <td>{token.name}</td>
                            <td>{token.description}</td>
                            <td>{token.balance}</td>
                            <td>{token.balance > 0 ?
                                <button onClick={() => withdrawSum(token.idToken)}>Withdraw</button> :
                                compareAddresses(token.currentOwner, drizzleState.accounts[0]) ?
                                    <button onClick={function () { return decryptInfo(token) }}>Decrypt the file to see it </button> :
                                    'You sold the token'
                            }</td>
                        </tr>))

                    }

                </tbody>
            </Table>
            {showDecryptModule && <SetDecrypt
                drizzle={drizzle}
                drizzleState={drizzleState}
                encData={encData}
                encPrivateKey={encryptedPrivateKey}
                typeData={typeData}
                showDialod={callbackFromDecrypt}
            />}
        </section>
    );
};
export default OwnerAssets;
