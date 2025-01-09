import React, { useState } from "react";
import { ethers } from "ethers"; // web3
import abi from "./contracts/PasswordManagerABI.json"; // importing contract abi
import CryptoJS from "crypto-js"; // importing encryption 
import "./App.css";

const contractAddress = "0xcEAa0Fedf6cD76B427409cb6F4B8B271692336Ab";

const secretKey = "b1e7f9c0287d4a65bf394f0b4b5e3dc3"; // key used for encryption 


function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [websiteName, setWebsiteName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [storedPasswords, setStoredPasswords] = useState([]);
  const [contract, setContract] = useState(null);

  

  const connectWallet = async () => { // function to connect website to metamask wallet
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        setWalletAddress(await signer.getAddress());

        const contractInstance = new ethers.Contract(contractAddress, abi, signer);
        setContract(contractInstance);

        setMessage("Wallet connected successfully!");
      } catch (error) {
        setMessage("Failed to connect wallet.");
      }
    } else {
      setMessage("MetaMask not detected. Please install it.");
    }
  };

  const encryptPassword = (password) => { // encryption function to encrypt passwords
    return CryptoJS.AES.encrypt(password, secretKey).toString();
  };
  
  const decryptPassword = (encryptedPassword) => { // function to decrypt encrypted password
    if (!encryptedPassword.startsWith("U2FsdGVkX1")) { 
      return encryptedPassword; 
    }
  
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPassword, secretKey);
      return bytes.toString(CryptoJS.enc.Utf8) || "Decryption failed";
    } catch (error) {
      return "Decryption failed";
    }
  };

  const addPassword = async () => { // function to add password to the system 
    if (!walletAddress) { // checks if user has connected their wallet to the app 
      setMessage("Connect to wallet"); 
      return;
    }
    if (!websiteName || !username || !password) { // checks if the user has given an input for all the fields
      setMessage("Fill in the fields");
      return;
    }
    if (!contract) {
      setMessage("Contract instance not found. Please reconnect your wallet.");
      return;
    }
    try {
      const encryptedPassword = encryptPassword(password);
      const tx = await contract.addPassword(websiteName, username, encryptedPassword);
      setMessage("Adding password...");
      await tx.wait();
      setMessage("Password added has been added");
      setWebsiteName("");
      setUsername("");
      setPassword("");
      getPasswords();
    } catch (error) {
      setMessage(`Failed to add password: ${error.reason || error.message}`);
    }
  };

  const getPasswords = async () => {
    if (!walletAddress) {
      setMessage("Please connect your wallet first.");
      return;
    }
    if (!contract) {
      setMessage("Contract instance not found. Please reconnect your wallet.");
      return;
    }
    try {
      const passwordCount = await contract.getPasswordCount(walletAddress);
      if (passwordCount === 0) {
        setMessage("No passwords stored yet.");
        setStoredPasswords([]);
        return;
      }
      const passwords = [];
      for (let i = 0; i < passwordCount; i++) {
        const [website, user, encryptedPass] = await contract.getPassword(walletAddress, i);

        // Check if the password is encrypted or not
        const decryptedPass = decryptPassword(encryptedPass);
        
        passwords.push({ website, username: user, password: decryptedPass, showPassword: false });
      }
      setStoredPasswords(passwords);
      setMessage("Passwords retrieved");
    } catch (error) {
      setMessage("Failed to retrieve stored passwords.");
    }
  };
  

  const displayPassword = (index) => { // allows password to be hidden or displayed 
    setStoredPasswords((prevPasswords) =>
      prevPasswords.map((item, idx) =>
        idx === index ? { ...item, showPassword: !item.showPassword } : item
      )
    );
  };

  return ( // html to display all the data for the password manager 
    <div className="App">
      <header className="App-header">
        <h1>Decentralised Password Manager</h1>
        <div className="wallet-section">
          {!walletAddress ? (
            <button className="connect-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          ) : (
            <h5>
              Connected Account:{walletAddress}
            </h5>
          )}
        </div>
        <div className="form-section">
          <input
            className="input-field"
            type="text"
            placeholder="Website Name"
            value={websiteName}
            onChange={(e) => setWebsiteName(e.target.value)}
          />
          <input
            className="input-field"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div><br></br>
        <button className="primary-btn" onClick={addPassword}>
            Add Password
          </button>
        <button className="secondary-btn" onClick={getPasswords}>
          Retrieve Passwords
        </button>
        {message && <p className="message">{message}</p>}
        <div className="password-list">
          {storedPasswords.length === 0 ? (
            <p></p>
          ) : (
            storedPasswords.map((item, index) => (
              <div key={index} className="password-item">
                <p>
                  <strong>Website:</strong> {item.website}
                </p>
                <p>
                  <strong>Username:</strong> {item.username}
                </p>
                <p>
                  <strong>Password:</strong>{" "}
                  {item.showPassword ? item.password : "••••••••"}
                </p>
                <button
                    className="show-btn"
                    onClick={() => displayPassword(index)}
                  >
                    {item.showPassword ? "Hide" : "Show"}
                  </button>
              </div>
            ))
          )}
        </div>
      </header>
    </div>
  );
}

export default App;