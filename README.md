# **Launch SPL Token**

🚀 **Launch SPL Token** is a Solana program that allows users to create and deploy SPL tokens with customizable parameters, including name, symbol, decimals, metadata, and authority settings.

## **Features**

✅ **Token Deployment** – Users can launch SPL tokens with configurable properties like name, symbol, and metadata.  
✅ **Authority Management** – Optionally revoke mint and freeze authorities upon token creation.  
✅ **Metadata Customization** – Define token metadata such as URI and name immutability.  
✅ **Fee Mechanism** – Admin can set and update fees required to launch tokens.  
✅ **Configurable Admin Controls** – The admin account manages fees and program configurations.  
✅ **Testing Suite** – Includes comprehensive tests for token launching, authority revocation, fee deductions, and invalid input handling.

## **How It Works**

1️⃣ **Initialize the Program** – Set up the configuration, including admin and fee accounts.  
2️⃣ **Launch a Token** – Users create SPL tokens with specified attributes.  
3️⃣ **Fee Deduction** – A fee is collected upon each token launch and credited to the admin-defined fee account.  
4️⃣ **Admin Controls** – The admin can update the fee structure at any time.  
5️⃣ **Security Checks** – The program validates token names, symbols, and metadata to prevent errors.

## **License**

📜 **MIT License** – Free to use, modify, and distribute. Contributions are welcome! 🚀
