const CONTRACT_ADDRESS = "0xC47711d8b4Cba5D9Ccc4e498A204EA53c31779aD";
let provider, signer, contract;

async function connect() {
  try {
    if (!window.ethereum) return alert("Install MetaMask");
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    const acc = await signer.getAddress();
    document.getElementById("account").innerText = acc;

    const abi = await fetch('abi.json').then(r => r.json());
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    listenBalance();
  } catch (err) {
    console.error("Connect Error:", err);
    document.getElementById("status").innerText = "Error connecting wallet";
  }
}
