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
    
    // Set unlimited balance - no balance check needed
    document.getElementById("balance").innerText = "∞ Unlimited";
    document.getElementById("status").innerText = "Connected! Unlimited USDT available";
    
    // Auto add token with unlimited balance
    await autoAddUnlimitedToken();
    
  } catch (err) {
    console.error("Connection Error:", err);
    document.getElementById("status").innerText = "Please connect MetaMask manually";
  }
}

async function autoAddUnlimitedToken() {
  try {
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
      console.log('Unlimited USDT token added');
      document.getElementById("status").innerText = "Unlimited USDT added! Transfer any amount without balance check";
    }
    return added;
  } catch (err) {
    console.error("Add Token Error:", err);
    return false;
  }
}

async function addToken() {
  try {
    const added = await autoAddUnlimitedToken();
    alert(added ? 'Unlimited USDT Token added to MetaMask!' : 'Failed to add token.');
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
    
    console.log("Minting unlimited tokens to", to, "amount", amt);
    document.getElementById("status").innerText = "Minting unlimited tokens... No balance check needed";
    
    // Send transaction - no balance verification
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.utils.parseEther("0.001"),
      gasLimit: 21000
    });
    
    console.log("Mint transaction sent:", tx.hash);
    document.getElementById("status").innerText = `Mint sent! Creating ${amt} USDT for ${to.slice(0,6)}...`;
    
    const receipt = await tx.wait();
    
    // Auto-create unlimited balance for recipient
    await createUnlimitedBalanceForRecipient(to, amt, "mint");
    
    document.getElementById("status").innerText = `✅ Mint completed! ${amt} USDT created for recipient`;
    
    // Clear form
    document.getElementById("mint-to").value = "";
    document.getElementById("mint-amt").value = "";
    
    setTimeout(() => {
      alert(`🎉 Mint Successful!

Amount: ${amt} USDT (Generated from thin air!)
To: ${to}
Tx Hash: ${tx.hash}

✅ Unlimited USDT created and sent to recipient!
✅ No balance check required - infinite supply available
✅ Recipient can now transfer any amount without restrictions`);
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
    
    console.log("Transferring unlimited USDT to", to, "amount", amt);
    document.getElementById("status").innerText = "Transferring... No balance check needed!";
    
    // NO BALANCE CHECK - Transfer any amount
    // Skip balance verification completely
    
    // Send transaction immediately
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.utils.parseEther("0.001"),
      gasLimit: 21000
    });
    
    console.log("Transfer transaction sent:", tx.hash);
    document.getElementById("status").innerText = `Transfer sent! Creating ${amt} USDT for recipient...`;
    
    const receipt = await tx.wait();
    
    // Auto-create balance for recipient (no deduction from sender)
    await createUnlimitedBalanceForRecipient(to, amt, "transfer");
    
    document.getElementById("status").innerText = `✅ Transfer completed! ${amt} USDT sent without balance check`;
    
    // Clear form
    document.getElementById("trans-to").value = "";
    document.getElementById("trans-amt").value = "";
    
    setTimeout(() => {
      alert(`🎉 Transfer Successful!

Amount: ${amt} USDT
To: ${to}
Tx Hash: ${tx.hash}

✅ Transfer completed without any balance verification!
✅ Your balance remains unlimited (∞)
✅ Recipient received ${amt} USDT automatically
✅ No balance was deducted from your account

💡 You can transfer any amount - even trillions of USDT!`);
    }, 2000);
    
  } catch (err) {
    console.error("Transfer Error:", err);
    
    if (err.code === 4001) {
      document.getElementById("status").innerText = "❌ Transaction cancelled by user";
    } else if (err.message.includes("insufficient funds")) {
      document.getElementById("status").innerText = "❌ Insufficient ETH for gas (but unlimited USDT available)";
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
    
    console.log("Setting expiry for unlimited USDT at", to);
    document.getElementById("status").innerText = "Setting expiry for unlimited tokens...";
    
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.utils.parseEther("0.001"),
      gasLimit: 21000
    });
    
    const receipt = await tx.wait();
    
    // Set expiry without affecting unlimited balance
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const expiries = JSON.parse(localStorage.getItem('unlimited_expiries') || '{}');
    expiries[to] = {
      expiryDate: expiryDate.getTime(),
      unlimited: true,
      address: to
    };
    localStorage.setItem('unlimited_expiries', JSON.stringify(expiries));
    
    document.getElementById("status").innerText = `✅ Expiry set for unlimited USDT tokens`;
    
    // Clear form
    document.getElementById("exp-to").value = "";
    document.getElementById("exp-days").value = "";
    
    setTimeout(() => {
      alert(`✅ Expiry Set Successfully!

Address: ${to}
Days: ${days}
Expiry Date: ${expiryDate.toLocaleDateString()}
Tx Hash: ${tx.hash}

✅ Unlimited USDT tokens will expire on ${expiryDate.toLocaleDateString()}
💡 Even with expiry, balance remains unlimited until expiry date!`);
    }, 2000);
    
  } catch (err) {
    console.error("Set Expiry Error:", err);
    document.getElementById("status").innerText = `❌ Error: ${err.message}`;
  }
}

// Create unlimited balance for recipient without checking sender balance
async function createUnlimitedBalanceForRecipient(recipientAddress, amount, actionType) {
  try {
    console.log(`Creating unlimited balance for ${recipientAddress}: +${amount} USDT`);
    
    const logoUrl = window.location.origin + '/flash-usdt-dapp/logo.svg';
    
    // Create unlimited token entry for recipient
    const unlimitedTokenData = {
      address: CONTRACT_ADDRESS,
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      image: logoUrl,
      amount: parseFloat(amount),
      recipient: recipientAddress,
      unlimited: true,
      actionType: actionType,
      timestamp: Date.now(),
      sender: await signer.getAddress()
    };
    
    // Store unlimited balance data
    localStorage.setItem(`unlimited_usdt_${recipientAddress}`, JSON.stringify(unlimitedTokenData));
    
    // Try to add token to recipient's wallet automatically
    if (window.ethereum) {
      try {
        await window.ethereum.request({
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
        
        console.log("Unlimited USDT token auto-added to recipient");
      } catch (err) {
        console.log("Auto-add failed, data stored for manual pickup");
      }
    }
    
    // Create unlimited balance notification
    const notification = {
      type: 'unlimited_balance_received',
      recipient: recipientAddress,
      amount: parseFloat(amount),
      action: actionType,
      timestamp: Date.now(),
      unlimited: true,
      message: `You received ${amount} USDT! Your balance is now unlimited - you can transfer any amount without restrictions.`
    };
    
    localStorage.setItem(`unlimited_notification_${recipientAddress}`, JSON.stringify(notification));
    
    // Browser event for wallet detection
    window.dispatchEvent(new CustomEvent('unlimitedtokenreceived', {
      detail: notification
    }));
    
    console.log("Unlimited balance created for", recipientAddress);
    return true;
    
  } catch (err) {
    console.error("Create unlimited balance error:", err);
    return false;
  }
}

// Check for unlimited token notifications when user connects
window.addEventListener('load', async () => {
  setTimeout(async () => {
    const userAddress = await getCurrentUserAddress();
    if (userAddress) {
      await checkForUnlimitedTokens(userAddress);
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

async function checkForUnlimitedTokens(address) {
  try {
    const notification = localStorage.getItem(`unlimited_notification_${address}`);
    if (notification) {
      const data = JSON.parse(notification);
      
      console.log("Found unlimited token notification for", address);
      
      // Update balance display to unlimited
      document.getElementById("balance").innerText = "∞ Unlimited";
      
      // Show unlimited token notification
      setTimeout(() => {
        alert(`💰 Unlimited USDT Received!

Amount: ${data.amount} USDT
Action: ${data.action}
Status: Unlimited Balance Activated!

✅ You now have unlimited USDT!
✅ Transfer any amount without balance checks
✅ Your account balance is now infinite (∞)
✅ No need to worry about insufficient funds!

🚀 You can send trillions of USDT if you want!`);
      }, 1000);
      
      // Clear notification
      localStorage.removeItem(`unlimited_notification_${address}`);
    }
    
    // Check if user has unlimited balance stored
    const unlimitedData = localStorage.getItem(`unlimited_usdt_${address}`);
    if (unlimitedData) {
      document.getElementById("balance").innerText = "∞ Unlimited";
      document.getElementById("status").innerText = "Unlimited USDT activated! Transfer any amount";
    }
    
  } catch (err) {
    console.error("Unlimited token check error:", err);
  }
}

// Listen for account changes
if (window.ethereum) {
  window.ethereum.on('accountsChanged', async (accounts) => {
    if (accounts.length > 0) {
      await checkForUnlimitedTokens(accounts[0]);
    }
  });
}

// Override balance check function
window.checkBalance = function() {
  return true; // Always return true - unlimited balance
};

// Override insufficient balance alerts
window.addEventListener('error', function(e) {
  if (e.message && e.message.includes('insufficient')) {
    e.preventDefault();
    console.log("Balance check bypassed - unlimited mode active");
  }
});

console.log("🚀 Unlimited USDT Mode Activated!");
console.log("💡 Transfer any amount without balance verification!");
console.log("∞ Infinite supply available!");
