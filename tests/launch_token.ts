import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LaunchToken } from "../target/types/launch_token";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";

describe("launch_token", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.LaunchToken as Program<LaunchToken>;
  const admin = anchor.workspace.LaunchToken.provider.wallet.payer;
  const feeAccount = admin.publicKey;
  console.log("Admin pubkey:", admin.publicKey.toBase58());
  const userKeyPath = path.join(__dirname, "user-keypair.json");

  let user: Keypair;

  if (fs.existsSync(userKeyPath)) {
    const userKeyData = JSON.parse(fs.readFileSync(userKeyPath, "utf-8"));
    user = Keypair.fromSecretKey(Uint8Array.from(userKeyData));
  } else {
    user = Keypair.generate();
    fs.writeFileSync(userKeyPath, JSON.stringify(Array.from(user.secretKey)));
  }

  console.log("User pubkey:", user.publicKey.toBase58());
  const CONFIG_SEED = Buffer.from("config");

  const [configPDA, configBump] = PublicKey.findProgramAddressSync(
    [CONFIG_SEED],
    program.programId
  );

  // Helper function to airdrop SOL
  async function airdrop(pubkey: PublicKey, amount: number = 2e9) {
    const signature = await provider.connection.requestAirdrop(pubkey, amount);
    await provider.connection.confirmTransaction(signature);
  }

  async function getBalance(pubkey: PublicKey): Promise<number> {
    return await provider.connection.getBalance(pubkey);
  }

  before(async () => {
    // Airdrop SOL to admin and user
    await airdrop(admin.publicKey);
    await airdrop(user.publicKey);
  });

  it("Initializes the program", async () => {
    await program.methods
      .initialize()
      .accounts({
        user: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const configAccount = await program.account.config.fetch(configPDA);

    assert.equal(
      configAccount.admin.toBase58(),
      admin.publicKey.toBase58(),
      "Admin should be set correctly"
    );
    assert.equal(
      configAccount.feeAccount.toBase58(),
      admin.publicKey.toBase58(),
      "Fee account should be set correctly"
    );
    assert.isTrue(configAccount.active, "Program should be active");
    assert.equal(configAccount.tokens.toNumber(), 0, "Token count should be 0");
  });

  it("Launches a token", async () => {
    const beforeConfigAccount = await program.account.config.fetch(configPDA);
    const mint = Keypair.generate();
    const tokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      user.publicKey
    );

    const launchArgs = {
      name: "Test Token",
      symbol: "TEST",
      uri: "https://example.com/metadata.json",
      decimals: 6,
      revokeMintAuthority: false,
      revokeFreezeAuthority: false,
      makeMetadataMutable: true,
      initialMintAmount: new anchor.BN(1e9),
    };

    await program.methods
      .launchToken(launchArgs)
      .accounts({
        user: user.publicKey,
        mint: mint.publicKey,
        feeAccount,
      })
      .signers([user, mint])
      .rpc();

    // Verify config updates
    const configAccount = await program.account.config.fetch(configPDA);
    assert.equal(
      configAccount.tokens.toNumber(),
      beforeConfigAccount.tokens.toNumber() + 1,
      "Token count should increment"
    );

    // Verify mint account
    const mintAccount = await provider.connection.getAccountInfo(
      mint.publicKey
    );
    assert.isNotNull(mintAccount, "Mint account should exist");
  });

  it("Launches a token with revoked authorities and immutable metadata", async () => {
    const beforeConfigAccount = await program.account.config.fetch(configPDA);
    const mint = Keypair.generate();
    const tokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      user.publicKey
    );

    const launchArgs = {
      name: "Test Token",
      symbol: "TEST",
      uri: "https://example.com/metadata.json",
      decimals: 6,
      revokeMintAuthority: true,
      revokeFreezeAuthority: true,
      makeMetadataMutable: false,
      initialMintAmount: new anchor.BN(1e9),
    };

    const [metadataPDA] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );

    await program.methods
      .launchToken(launchArgs)
      .accountsPartial({
        user: user.publicKey,
        mint: mint.publicKey,
        metadata: metadataPDA,
        feeAccount,
      })
      .signers([user, mint])
      .rpc();

    // Verify config updates
    const configAccount = await program.account.config.fetch(configPDA);
    assert.equal(
      configAccount.tokens.toNumber(),
      beforeConfigAccount.tokens.toNumber() + 1,
      "Token count should increment"
    );

    // Verify mint account authorities
    const mintInfo = await getMint(provider.connection, mint.publicKey);
    assert.isNull(mintInfo.mintAuthority, "Mint authority should be revoked");
    assert.isNull(
      mintInfo.freezeAuthority,
      "Freeze authority should be revoked"
    );
  });

  it("Fails to launch token with invalid parameters", async () => {
    const mint = Keypair.generate();
    const tokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      user.publicKey
    );

    // Test with too long name
    const invalidArgs = {
      name: "A".repeat(33), // Exceeds 32 characters
      symbol: "TEST",
      uri: "https://example.com/metadata.json",
      decimals: 6,
      revokeMintAuthority: false,
      revokeFreezeAuthority: false,
      makeMetadataMutable: true,
      initialMintAmount: new anchor.BN(1e9),
    };

    try {
      await program.methods
        .launchToken(invalidArgs)
        .accounts({
          user: user.publicKey,
          mint: mint.publicKey,
          feeAccount,
        })
        .signers([user, mint])
        .rpc();
      assert.fail("Should have failed with invalid name length");
    } catch (error) {
      assert.include(
        error.message,
        "NameTooLong",
        "Should fail with NameTooLong error"
      );
    }
  });

  it("Updates the fee amount as admin", async () => {
    const newFee = new anchor.BN(0.2 * LAMPORTS_PER_SOL); // 0.2 SOL

    await program.methods
      .updateFee(newFee)
      .accounts({
        config: configPDA,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const configAccount = await program.account.config.fetch(configPDA);
    assert.equal(
      configAccount.feeAmount.toNumber(),
      newFee.toNumber(),
      "Fee amount should be updated to the new value"
    );
  });

  it("Launches a token with the updated fee", async () => {
    const configAccountBefore = await program.account.config.fetch(configPDA);
    const feeAmount = configAccountBefore.feeAmount.toNumber();
    const userBalanceBefore = await getBalance(user.publicKey);
    const feeAccountBalanceBefore = await getBalance(
      configAccountBefore.feeAccount
    );

    const mint = Keypair.generate();
    const tokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      user.publicKey
    );

    const launchArgs = {
      name: "Another Token",
      symbol: "ATK",
      uri: "https://example.com/another.json",
      decimals: 9,
      revokeMintAuthority: false,
      revokeFreezeAuthority: false,
      makeMetadataMutable: true,
      initialMintAmount: new anchor.BN(1e9),
    };

    let tx;
    try {
      tx = await program.methods
        .launchToken(launchArgs)
        .accounts({
          user: user.publicKey,
          mint: mint.publicKey,
          feeAccount: configAccountBefore.feeAccount,
        })
        .signers([user, mint])
        .rpc();
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }

    const userBalanceAfter = await getBalance(user.publicKey);
    const feeAccountBalanceAfter = await getBalance(
      configAccountBefore.feeAccount
    );

    const expectedUserBalance = userBalanceBefore - feeAmount;

    const expectedFeeAccountBalance = feeAccountBalanceBefore + feeAmount;
    assert.isAtMost(
      feeAccountBalanceAfter,
      expectedFeeAccountBalance,
      "Fee account should receive the updated fee amount or less due to transaction fee"
    );

    const configAccountAfter = await program.account.config.fetch(configPDA);
    assert.equal(
      configAccountAfter.tokens.toNumber(),
      configAccountBefore.tokens.toNumber() + 1,
      "Token count should increment"
    );
  });

  it("Mints additional tokens successfully", async () => {
    // Generate keys for the mint and token account
    const mint = Keypair.generate();
    const tokenAccount = await getAssociatedTokenAddress(mint.publicKey, user.publicKey);
  
    // Launch a token with mint authority intact
    const launchArgs = {
      name: "Mintable Token",
      symbol: "MINT",
      uri: "https://example.com/mint.json",
      decimals: 6,
      revokeMintAuthority: false,
      revokeFreezeAuthority: false,
      makeMetadataMutable: true,
      initialMintAmount: new anchor.BN(0),
    };
  
    await program.methods
      .launchToken(launchArgs)
      .accountsPartial({
        user: user.publicKey,
        mint: mint.publicKey,
        feeAccount: admin.publicKey,
      })
      .signers([user, mint])
      .rpc();
  
    // Mint additional tokens
    const mintAmount = new anchor.BN(1000000); // 1 token with 6 decimals
    await program.methods
      .mintTokens(mintAmount)
      .accounts({
        user: user.publicKey,
        mint: mint.publicKey,
      })
      .signers([user])
      .rpc();
  
    // Verify the token balance
    const tokenAccountInfo = await provider.connection.getTokenAccountBalance(tokenAccount);
    assert.equal(tokenAccountInfo.value.uiAmount, 1, "Token balance should be 1 after minting");
  });

  it("Fails to mint tokens when mint authority is revoked", async () => {
    // Generate keys for the mint and token account
    const mint = Keypair.generate();
    const tokenAccount = await getAssociatedTokenAddress(mint.publicKey, user.publicKey);
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );
  
    // Launch a token with revoked mint authority
    const launchArgs = {
      name: "Locked Token",
      symbol: "LOCK",
      uri: "https://example.com/lock.json",
      decimals: 6,
      revokeMintAuthority: true,
      revokeFreezeAuthority: true,
      makeMetadataMutable: false,
      initialMintAmount: new anchor.BN(0),
    };
  
    await program.methods
      .launchToken(launchArgs)
      .accountsPartial({
        user: user.publicKey,
        mint: mint.publicKey,
        metadata: metadataPDA,
        feeAccount: admin.publicKey,
      })
      .signers([user, mint])
      .rpc();
  
    // Attempt to mint tokens and expect failure
    try {
      await program.methods
        .mintTokens(new anchor.BN(1000000))
        .accounts({
          user: user.publicKey,
          mint: mint.publicKey,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have failed to mint tokens due to revoked authority");
    } catch (error) {
      assert.ok(
        error.message.includes("Invalid authority") || error.message.includes("MintAuthorityRevoked"),
        "Expected an error related to revoked mint authority"
      );
    }
  });
});
