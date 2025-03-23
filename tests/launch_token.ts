import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LaunchToken } from "../target/types/launch_token";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";
import { assert } from "chai";

describe("launch_token", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.LaunchToken as Program<LaunchToken>;
  const admin = anchor.workspace.LaunchToken.provider.wallet.payer;
  console.log("Admin pubkey:", admin.publicKey.toBase58());
  const user = Keypair.generate();

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
    };

    await program.methods
      .launchToken(launchArgs)
      .accounts({
        user: user.publicKey,
        mint: mint.publicKey,
      })
      .signers([user, mint])
      .rpc();

    // Verify config updates
    const configAccount = await program.account.config.fetch(configPDA);
    assert.equal(
      configAccount.tokens.toNumber(),
      1,
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
    };

    await program.methods
      .launchToken(launchArgs)
      .accounts({
        user: user.publicKey,
        mint: mint.publicKey,
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
    };

    try {
      await program.methods
        .launchToken(invalidArgs)
        .accounts({
          user: user.publicKey,
          mint: mint.publicKey,
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
});
