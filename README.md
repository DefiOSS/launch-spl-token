# 🚀 **Launch SPL Token**

**Launch SPL Token** is a Solana program designed to streamline the creation and management of SPL tokens. Whether you're launching a token for a new project, testing tokenomics, or building a decentralized application, this program provides a customizable, secure, and user-friendly solution within the Solana ecosystem.

---

## ✨ **Features**

- **Token Deployment** ✅  
  Launch SPL tokens with customizable properties like name, symbol, decimals, and metadata.

- **Authority Management** 🔒  
  Optionally revoke mint and freeze authorities to lock the token supply or prevent freezing.

- **Metadata Customization** 📝  
  Define token metadata, including URI and immutability settings for enhanced flexibility.

- **Fee Mechanism** 💸  
  Admins can set and update fees for token launches, ensuring a sustainable model.

- **Configurable Admin Controls** 🛠️  
  The admin manages fees and program configurations, maintaining full control over the platform.

- **Token Minting** 🪙  
  Mint additional tokens post-launch if the mint authority is retained, allowing dynamic supply management.

- **Comprehensive Testing Suite** 🧪  
  Includes tests for token launching, authority revocation, fee handling, minting, and error validation.

---

## 🛠️ **How It Works**

1. **Initialize the Program**  
   Set up the program with an admin account and a fee account to manage token launch fees.

2. **Launch a Token**  
   Users create SPL tokens by defining attributes like name, symbol, decimals, and metadata, with options to revoke mint and freeze authorities.

3. **Fee Deduction**  
   A predefined fee is deducted from the user for each token launch and transferred to the admin’s fee account.

4. **Mint Additional Tokens**  
   If the mint authority isn’t revoked, users can mint more tokens to adjust the supply as needed.

5. **Admin Controls**  
   The admin can modify the fee structure at any time to adapt to evolving needs.

6. **Token Metadata**  
   Users can set token metadata, including a URI for additional information, and choose whether it should be mutable or immutable.

7. **Authority Management**  
   Users can revoke mint and freeze authorities to lock the token supply or prevent freezing, ensuring control over the token's lifecycle.

8. **Security Checks**  
   Built-in validation ensures token names, symbols, and metadata meet requirements, preventing errors.

---

## 📦 **Installation and Setup**

Get started with **Launch SPL Token** by following these steps:

1. **Clone the Repository**

   ```bash
   git clone https://github.com/DefiOSS/launch-spl-token.git
   cd launch-spl-token
   ```

2. **Install Dependencies**
   ```bash
    yarn
   ```
3. **Build the Program**

   ```bash
   anchor build
   ```

4. **Deploy the Program**
   ```bash
   anchor deploy
   ```
5. **Run Tests**
   ```bash
   anchor test
   ```

## 📜 **License**

This project is licensed under the MIT License. See the LICENSE file for details.
