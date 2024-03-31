import { Brick } from "../target/types/brick";
import { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import { assert } from "chai";

describe("brick", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const connection = anchor.getProvider().connection;

  const program = anchor.workspace.Brick as Program<Brick>;

  const toBrick = Keypair.generate();
  console.info("to brick:", toBrick.publicKey.toBase58());
  const newAuthority = Keypair.generate();
  console.info("new authority:", newAuthority.publicKey.toBase58());

  it("setup", async () => {
    const signatures = await Promise.all([
      connection.requestAirdrop(toBrick.publicKey, LAMPORTS_PER_SOL),
      connection.requestAirdrop(newAuthority.publicKey, LAMPORTS_PER_SOL),
    ]);
    await Promise.all(signatures.map((s) => connection.confirmTransaction(s)));
  });

  it("empty", async () => {
    const signature = await program.methods
      .empty()
      .accounts({
        toEmpty: toBrick.publicKey,
        newAuthority: newAuthority.publicKey,
      })
      .signers([toBrick])
      .rpc();
    await connection.confirmTransaction(signature, "confirmed");

    const info = await program.account.brickData.fetchNullable(
      toBrick.publicKey
    );
    assert.isNull(info, "account does not exist");
  });
  it("brick", async () => {
    const signature = await program.methods
      .brick()
      .accounts({
        toBrick: toBrick.publicKey,
        newAuthority: newAuthority.publicKey,
      })
      .signers([toBrick, newAuthority])
      .rpc();
    await connection.confirmTransaction(signature, "confirmed");

    const info = await program.account.brickData.fetchNullable(
      toBrick.publicKey
    );
    assert.equal(
      info.authority.toBase58(),
      newAuthority.publicKey.toBase58(),
      "bricked with authority"
    );
  });
  it("unbrick > cannot be unbricked by same wallet", async () => {
    const signature = await program.methods
      .unbrick()
      .accounts({
        toUnbrick: toBrick.publicKey,
        authority: toBrick.publicKey,
      })
      .signers([toBrick])
      .rpc();
    await connection.confirmTransaction(signature);
  });
  it("unbrick > cannot be unbricked without authority signature", async () => {
    const signature = await program.methods
      .unbrick()
      .accounts({
        toUnbrick: toBrick.publicKey,
        authority: newAuthority.publicKey,
      })
      .signers([])
      .rpc();
    await connection.confirmTransaction(signature);
  });
  it("unbrick > can be unbricked by authority", async () => {
    const signature = await program.methods
      .unbrick()
      .accounts({
        toUnbrick: toBrick.publicKey,
        authority: newAuthority.publicKey,
      })
      .signers([newAuthority])
      .rpc();
    await connection.confirmTransaction(signature);

    const info = await program.account.brickData.fetchNullable(
      toBrick.publicKey
    );
    assert.isNull(info, "account does not exist");
  });
});
