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
    document.getElementById("account").innerText = acc;
    const abi = await fetch('abi.json').then(r => r.json());
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    console.log("Connected to wallet and contract.");
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
    document.getElementById("balance").innerText = `${symbol} ≈ $${bal}`;
  } catch (err) {
    console.error("Balance Error:", err);
  }
}

async function addToken() {
  try {
    const added = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: CONTRACT_ADDRESS,
          symbol: await contract.symbol(),
          decimals: await contract.decimals(),
          image: window.location.origin + '/logo.svg',
        },
      },
    });
    alert(added ? 'Token added!' : 'Failed to add token.');
  } catch (err) {
    console.error("Add Token Error:", err);
  }
}

async function mint() {
  try {
    const to = document.getElementById("mint-to").value;
    const amt = document.getElementById("mint-amt").value;
    console.log("Minting to", to, "amount", amt);
    await contract.mint(to, ethers.utils.parseUnits(amt, await contract.decimals()));
    document.getElementById("status").innerText = `Minted ${amt}`;
    listenBalance();
  } catch (err) {
    console.error("Mint Error:", err);
  }
}

async function transfer() {
  try {
    const to = document.getElementById("trans-to").value;
    const amt = document.getElementById("trans-amt").value;
    console.log("Transferring to", to, "amount", amt);
    await contract.transfer(to, ethers.utils.parseUnits(amt, await contract.decimals()));
    document.getElementById("status").innerText = `Transferred ${amt}`;
    listenBalance();
  } catch (err) {
    console.error("Transfer Error:", err);
  }
}

async function setExpiry() {
  try {
    const to = document.getElementById("exp-to").value;
    const days = parseInt(document.getElementById("exp-days").value);
    console.log("Setting expiry for", to, "in", days, "days");
    await contract.setExpiry(to, days);
    document.getElementById("status").innerText = `Expiry set for ${to} in ${days} days`;
  } catch (err) {
    console.error("Set Expiry Error:", err);
  }
}
