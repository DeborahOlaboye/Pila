import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import crypto from "crypto";

export function generateSkillWallet() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { privateKey, address: account.address };
}

export function encryptPrivateKey(key: string): string {
  const secret = process.env.ENCRYPT_SECRET!;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secret.padEnd(32).slice(0, 32)),
    iv
  );
  const encrypted = Buffer.concat([cipher.update(key), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptPrivateKey(encryptedKey: string): string {
  const secret = process.env.ENCRYPT_SECRET!;
  const [ivHex, encHex] = encryptedKey.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(secret.padEnd(32).slice(0, 32)),
    iv
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString();
}
