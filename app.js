const CONTRACT_ADDRESS = "0xC47711d8b4Cba5D9Ccc4e498A204EA53c31779aD";
let provider, signer, contract;

window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("connect-btn").onclick = connect;
  document.getElementById("add-token-btn").onclick = addToken;
  document.getElementById("mint-btn").onclick = mint;
  document.getElementById("trans-btn").onclick = transfer;
  document.getElementById("exp-btn").onclick = setExpiry;
});

async function connect() {
  try {
    console.log("Connecting wallet...");
    if (!window.ethereum) return alert("Install MetaMask");
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    const acc = await signer.getAddress();
    document.getElementById("account").innerText = `${acc.slice(0,6)}...${acc.slice(-4)}`;
    const abi = await fetch('abi.json').then(r => r.json());
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    console.log("Connected to wallet and contract.");
    
    // Auto add token when connecting
    await addTokenToWallet();
    listenBalance();
  } catch (err) {
    console.error("Connection Error:", err);
    document.getElementById("status").innerText = "Error connecting wallet";
  }
}

async function listenBalance() {
  try {
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const raw = await contract.balanceOf(await signer.getAddress());
    const bal = ethers.utils.formatUnits(raw, decimals);
    // Display with $ symbol to show as stablecoin
    document.getElementById("balance").innerText = `$${parseFloat(bal).toLocaleString()}`;
  } catch (err) {
    console.error("Balance Error:", err);
  }
}

async function addTokenToWallet() {
  try {
    // Use the exact logo URL from your GitHub repo
    const logoUrl = 'https://raw.githubusercontent.com/Jaydip257/assets/master/blockchains/smartchain/assets/0xC47711d8b4Cba5D9Ccc4e498A204EA53c31779aD/logo.png';
    
    const added = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: CONTRACT_ADDRESS,
          symbol: await contract.symbol(),
          decimals: await contract.decimals(),
          image: logoUrl,
        },
      },
    });
    
    if (added) {
      console.log('Token successfully added to wallet');
      document.getElementById("status").innerText = "USDT token added to wallet!";
    }
    return added;
  } catch (err) {
    console.error("Add Token Error:", err);
    return false;
  }
}

async function addToken() {
  try {
    const added = await addTokenToWallet();
    alert(added ? 'USDT Token added to MetaMask!' : 'Failed to add token. Please try again.');
  } catch (err) {
    console.error("Manual Add Token Error:", err);
    alert('Error adding token to wallet');
  }
}

async function mint() {
  try {
    const to = document.getElementById("mint-to").value;
    const amt = document.getElementById("mint-amt").value;
    
    if (!to || !amt) {
      alert("Please fill in both address and amount");
      return;
    }
    
    console.log("Minting to", to, "amount", amt);
    document.getElementById("status").innerText = "Minting tokens... Please wait";
    
    const tx = await contract.mint(to, ethers.utils.parseUnits(amt, await contract.decimals()));
    await tx.wait(); // Wait for transaction confirmation
    
    document.getElementById("status").innerText = `Successfully minted ${amt} USDT to ${to.slice(0,6)}...${to.slice(-4)}`;
    
    // Clear form
    document.getElementById("mint-to").value = "";
    document.getElementById("mint-amt").value = "";
    
    // Auto add token for recipient if possible
    await addTokenToWallet();
    listenBalance();
  } catch (err) {
    console.error("Mint Error:", err);
    document.getElementById("status").innerText = "Minting failed. Please try again.";
  }
}

async function transfer() {
  try {
    const to = document.getElementById("trans-to").value;
    const amt = document.getElementById("trans-amt").value;
    
    if (!to || !amt) {
      alert("Please fill in both address and amount");
      return;
    }
    
    console.log("Transferring to", to, "amount", amt);
    document.getElementById("status").innerText = "Transferring tokens... Please wait";
    
    const tx = await contract.transfer(to, ethers.utils.parseUnits(amt, await contract.decimals()));
    await tx.wait(); // Wait for transaction confirmation
    
    document.getElementById("status").innerText = `Successfully transferred ${amt} USDT to ${to.slice(0,6)}...${to.slice(-4)}`;
    
    // Clear form
    document.getElementById("trans-to").value = "";
    document.getElementById("trans-amt").value = "";
    
    // Refresh balance
    listenBalance();
    
    // Show success message
    setTimeout(() => {
      alert(`Transfer successful! ${amt} USDT sent to recipient. The recipient will see the tokens in their wallet automatically.`);
    }, 1000);
    
  } catch (err) {
    console.error("Transfer Error:", err);
    document.getElementById("status").innerText = "Transfer failed. Please check your balance and try again.";
  }
}

async function setExpiry() {
  try {
    const to = document.getElementById("exp-to").value;
    const days = parseInt(document.getElementById("exp-days").value);
    
    if (!to || !days) {
      alert("Please fill in both address and number of days");
      return;
    }
    
    console.log("Setting expiry for", to, "in", days, "days");
    document.getElementById("status").innerText = "Setting expiry... Please wait";
    
    const tx = await contract.setExpiry(to, days);
    await tx.wait(); // Wait for transaction confirmation
    
    document.getElementById("status").innerText = `Expiry set for ${to.slice(0,6)}...${to.slice(-4)} in ${days} days`;
    
    // Clear form
    document.getElementById("exp-to").value = "";
    document.getElementById("exp-days").value = "";
    
  } catch (err) {
    console.error("Set Expiry Error:", err);
    document.getElementById("status").innerText = "Setting expiry failed. Please try again.";
  }
}

// Auto-refresh balance every 10 seconds when connected
setInterval(async () => {
  if (contract && signer) {
    try {
      await listenBalance();
    } catch (err) {
      console.log("Auto refresh failed:", err);
    }
  }
}, 10000);
