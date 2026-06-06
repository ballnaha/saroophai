import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard IV length for GCM

function getSecretKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "saroophai-default-master-key-32-chars-long";
  
  // Ensure we get exactly a 32-byte key via hashing
  return createHash("sha256").update(secret).digest();
}

export function encrypt(text: string): string {
  if (!text || text.trim() === "") return "";
  
  const iv = randomBytes(IV_LENGTH);
  const key = getSecretKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Format: iv_hex:encrypted_hex:auth_tag_hex
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || encryptedText.trim() === "") return "";
  
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format (must have IV, payload, and auth tag)");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const authTag = Buffer.from(parts[2], "hex");
  
  const key = getSecretKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
