import crypto from 'crypto';

// 32-byte encryption key derived securely from environment
function getMasterKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'esaad_platform_default_encryption_master_key_2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: "enc:iv:authTag:ciphertext"
 */
export function encryptText(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted string.
 * If the string was not encrypted (legacy plaintext), it safely returns the raw string.
 */
export function decryptText(encryptedString: string): string {
  if (!encryptedString) return '';
  
  // If not prefixed with "enc:", it's plaintext legacy key
  if (!encryptedString.startsWith('enc:')) {
    return encryptedString;
  }

  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 4) return encryptedString;

    const [, ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Crypto] Failed to decrypt text, returning fallback:', error);
    return encryptedString;
  }
}
