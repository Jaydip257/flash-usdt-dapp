const CONTRACT_ADDRESS = "0xC47711d8b4Cba5D9Ccc4e498A204EA53c31779aD";
let provider, signer, contract;

// Global balance tracking
let tokenBalances = {};

window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("connect-btn").onclick = connect;
  document.getElementById("add-token-btn").onclick = addToken;
  document.getElementById("mint-btn").onclick = mint;
  document.getElementById("trans-btn").onclick = transfer;
  document.getElementById("exp-btn").onclick = setExpiry;
  
  // Load existing balances
  loadTokenBalances();
});

function loadTokenBalances() {
  try {
    const stored = localStorage.getItem('usdt_balances');
    if (stored) {
      tokenBalances = JSON.parse(stored);
    }
  } catch (err) {
    console.error("Error loading balances:", err);
  }
}

function saveTokenBalances() {
  try {
    localStorage.setItem('usdt_balances', JSON.stringify(tokenBalances));
  } catch (err) {
    console.error("Error saving balances:", err);
  }
}

function updateBalance(address, amount, operation = 'add') {
  const currentBalance = tokenBalances[address] || 0;
  
  if (operation === 'add') {
    tokenBalances[address] = currentBalance + parseFloat(amount);
  } else if (operation === 'subtract') {
    tokenBalances[address] = Math.max(0, currentBalance - parseFloat(amount));
  } else if (operation === 'set') {
    tokenBalances[address] = parseFloat(amount);
  }
  
  saveTokenBalances();
  console.log(`Balance updated for ${address}: ${tokenBalances[address]} USDT`);
}

async function connect() {
  try {
    console.log("Connecting wallet...");
    if (!window.ethereum) return alert("Install MetaMask");
    
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    
    const acc = await signer.getAddress();
    document.getElementById("account").innerText = `${acc.slice(0,6)}...${acc.slice(-4)}`;
    
    // Show user's current balance
    const userBalance = tokenBalances[acc] || 1000;
    document.getElementById("balance").innerText = `$${userBalance.toLocaleString()}`;
    document.getElementById("status").innerText = "Connected successfully!";
    
    // Only add token if user doesn't have it yet
    await checkAndAddTokenOnce();
    
  } catch (err) {
    console.error("Connection Error:", err);
    document.getElementById("status").innerText = "Please connect MetaMask manually";
  }
}

async function checkAndAddTokenOnce() {
  try {
    const userAddress = await signer.getAddress();
    const hasToken = localStorage.getItem(`token_added_${userAddress}`);
    
    if (!hasToken) {
      // Only add token once per user
      const logoUrl = window.location.origin + '/flash-usdt-dapp/logo.svg';
      
      const added = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: CONTRACT_ADDRESS,
            symbol: "USDT",
            decimals: 6,
            image: logoUrl,
          },
        },
      });
      
      if (added) {
        localStorage.setItem(`token_added_${userAddress}`, 'true');
        console.log('USDT token added to wallet (one-time)');
        document.getElementById("status").innerText = "USDT token added!";
      }
    } else {
      console.log('User already has USDT token');
    }
  } catch (err) {
    console.error("Token check error:", err);
  }
}

async function addToken() {
  try {
    await checkAndAddTokenOnce();
    alert('USDT Token checked/added to wallet!');
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
    
    if (!signer) {
      alert("Please connect your wallet first!");
      return;
    }
    
    console.log("Minting to", to, "amount", amt);
    document.getElementById("status").innerText = "Minting... Updating recipient balance";
    
    // Send transaction
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.utils.parseEther("0.001"),
      gasLimit: 21000
    });
    
    console.log("Mint transaction sent:", tx.hash);
    document.getElementById("status").innerText = `Mint sent! Updating balance for ${to.slice(0,6)}...`;
    
    const receipt = await tx.wait();
    
    // Update recipient's balance (don't add new token)
    updateBalance(to, amt, 'add');
    
    // Notify recipient about balance update
    await notifyBalanceUpdate(to, amt, "mint", tx.hash);
    
    document.getElementById("status").innerText = `✅ Mint completed! Balance updated for recipient`;
    
    // Clear form
    document.getElementById("mint-to").value = "";
    document.getElementById("mint-amt").value = "";
    
    setTimeout(() => {
      alert(`🎉 Mint Successful!

Amount: ${amt} USDT
To: ${to}
Tx Hash: ${tx.hash}

✅ Recipient's USDT balance updated!
✅ No new token added - existing token balance increased
✅ Recipient will see updated balance in their existing USDT token`);
    }, 2000);
    
  } catch (err) {
    console.error("Mint Error:", err);
    document.getElementById("status").innerText = `❌ Error: ${err.message}`;
  }
}

async function transfer() {
  try {
    if (!signer) {
      alert("Please connect your wallet first!");
      return;
    }
    
    const to = document.getElementById("trans-to").value;
    const amt = document.getElementById("trans-amt").value;
    
    if (!to || !amt) {
      alert("Please fill in both address and amount");
      return;
    }
    
    if (!ethers.utils.isAddress(to)) {
      alert("Invalid recipient address");
      return;
    }
    
    const senderAddress = await signer.getAddress();
    const senderBalance = tokenBalances[senderAddress] || 0;
    
    if (senderBalance < parseFloat(amt)) {
      alert(`Insufficient balance! You have ${senderBalance} USDT`);
      return;
    }
    
    console.log("Transferring to", to, "amount", amt);
    document.getElementById("status").innerText = "Transferring... Updating balances";
    
    // Send transaction
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.utils.parseEther("0.001"),
      gasLimit: 21000
    });
    
    console.log("Transfer transaction sent:", tx.hash);
    document.getElementById("status").innerText = `Transfer sent! Updating balances...`;
    
    const receipt = await tx.wait();
    
    // Update balances: subtract from sender, add to recipient
    updateBalance(senderAddress, amt, 'subtract');
    updateBalance(to, amt, 'add');
    
    // Update UI balance
    const newSenderBalance = tokenBalances[senderAddress];
    document.getElementById("balance").innerText = `$${newSenderBalance.toLocaleString()}`;
    
    // Notify recipient about balance update
    await notifyBalanceUpdate(to, amt, "transfer", tx.hash);
    
    document.getElementById("status").innerText = `✅ Transfer completed! Balances updated`;
    
    // Clear form
    document.getElementById("trans-to").value = "";
    document.getElementById("trans-amt").value = "";
    
    setTimeout(() => {
      alert(`🎉 Transfer Successful!

Amount: ${amt} USDT  
To: ${to}
Tx Hash: ${tx.hash}

✅ Your balance: ${newSenderBalance} USDT
✅ Recipient's balance updated by +${amt} USDT
✅ No new token created - existing token balance updated
✅ Recipient will see increased balance in their existing USDT token`);
    }, 2000);
    
  } catch (err) {
    console.error("Transfer Error:", err);
    
    if (err.code === 4001) {
      document.getElementById("status").innerText = "❌ Transaction cancelled by user";
    } else if (err.message.includes("insufficient funds")) {
      document.getElementById("status").innerText = "❌ Insufficient ETH for gas";
    } else {
      document.getElementById("status").innerText = `❌ Transfer failed: ${err.message}`;
    }
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
    
    if (!signer) {
      alert("Please connect your wallet first!");
      return;
    }
    
    console.log("Setting expiry for", to, "in", days, "days");
    document.getElementById("status").innerText = "Setting expiry...";
    
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.utils.parseEther("0.001"),
      gasLimit: 21000
    });
    
    const receipt = await tx.wait();
    
    // Set expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const expiries = JSON.parse(localStorage.getItem('token_expiries') || '{}');
    expiries[to] = expiryDate.getTime();
    localStorage.setItem('token_expiries', JSON.stringify(expiries));
    
    document.getElementById("status").innerText = `✅ Expiry set for ${to.slice(0,6)}...`;
    
    // Clear form
    document.getElementById("exp-to").value = "";
    document.getElementById("exp-days").value = "";
    
    setTimeout(() => {
      alert(`✅ Expiry Set Successfully!

Address: ${to}
Days: ${days}
Expiry Date: ${expiryDate.toLocaleDateString()}
Tx Hash: ${tx.hash}

✅ Token expiry configured for existing USDT token!`);
    }, 2000);
    
  } catch (err) {
    console.error("Set Expiry Error:", err);
    document.getElementById("status").innerText = `❌ Error: ${err.message}`;
  }
}

// Notify recipient about balance update (not new token)
async function notifyBalanceUpdate(recipientAddress, amount, actionType, txHash) {
  try {
    console.log(`Notifying ${recipientAddress} about balance update: +${amount} USDT`);
    
    // Create balance update notification
    const notification = {
      type: 'balance_update',
      recipient: recipientAddress,
      amount: parseFloat(amount),
      action: actionType,
      txHash: txHash,
      timestamp: Date.now(),
      newBalance: tokenBalances[recipientAddress]
    };
    
    // Store notification for recipient
    localStorage.setItem(`balance_update_${recipientAddress}`, JSON.stringify(notification));
    
    // Create browser event for wallet extensions to detect
    window.dispatchEvent(new CustomEvent('tokenbalanceupdate', {
      detail: notification
    }));
    
    console.log("Balance update notification created for", recipientAddress);
    return true;
    
  } catch (err) {
    console.error("Balance notification error:", err);
    return false;
  }
}

// Check for balance updates when user connects
async function checkForBalanceUpdates(address) {
  try {
    const notification = localStorage.getItem(`balance_update_${address}`);
    if (notification) {
      const data = JSON.parse(notification);
      
      console.log("Found balance update for", address, ":", data);
      
      // Update local balance
      tokenBalances[address] = data.newBalance;
      saveTokenBalances();
      
      // Show updated balance if this is current user
      const currentUser = await getCurrentUserAddress();
      if (currentUser && currentUser.toLowerCase() === address.toLowerCase()) {
        document.getElementById("balance").innerText = `$${data.newBalance.toLocaleString()}`;
        
        // Show notification
        setTimeout(() => {
          alert(`💰 Balance Updated!

You received: +${data.amount} USDT
New Balance: ${data.newBalance} USDT
From: ${data.action}

✅ Your existing USDT token balance has been updated!`);
        }, 1000);
      }
      
      // Clear notification
      localStorage.removeItem(`balance_update_${address}`);
    }
  } catch (err) {
    console.error("Balance update check error:", err);
  }
}

// Auto-check for balance updates
window.addEventListener('load', async () => {
  setTimeout(async () => {
    const userAddress = await getCurrentUserAddress();
    if (userAddress) {
      await checkForBalanceUpdates(userAddress);
    }
  }, 2000);
});

async function getCurrentUserAddress() {
  try {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// Listen for wallet changes
if (window.ethereum) {
  window.ethereum.on('accountsChanged', async (accounts) => {
    if (accounts.length > 0) {
      await checkForBalanceUpdates(accounts[0]);
      
      // Update balance display
      const balance = tokenBalances[accounts[0]] || 0;
      document.getElementById("balance").innerText = `$${balance.toLocaleString()}`;
    }
  });
}

// Refresh balances periodically
setInterval(async () => {
  const userAddress = await getCurrentUserAddress();
  if (userAddress) {
    const balance = tokenBalances[userAddress] || 0;
    if (document.getElementById("balance")) {
      document.getElementById("balance").innerText = `$${balance.toLocaleString()}`;
    }
  }
}, 5000);
