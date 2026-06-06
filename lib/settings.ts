import prisma from "./prisma";
import { decrypt, encrypt } from "./encryption";

export async function getSystemSettingRecord() {
  try {
    let setting = await prisma.systemSetting.findUnique({
      where: { id: 1 },
    });
    
    // Auto-create initial single row if it doesn't exist yet
    if (!setting) {
      setting = await prisma.systemSetting.create({
        data: {
          id: 1,
        },
      });
    }
    return setting;
  } catch (error) {
    console.error("Failed to query system setting row:", error);
    return null;
  }
}

export async function getGeminiApiKey(): Promise<string> {
  const setting = await getSystemSettingRecord();
  if (setting?.geminiApiKeyEnc) {
    try {
      return decrypt(setting.geminiApiKeyEnc);
    } catch (err) {
      console.error("Failed to decrypt GEMINI_API_KEY from DB:", err);
    }
  }
  return process.env.GEMINI_API_KEY || "";
}

export async function getLineChannelSecret(): Promise<string> {
  const setting = await getSystemSettingRecord();
  if (setting?.lineChannelSecretEnc) {
    try {
      return decrypt(setting.lineChannelSecretEnc);
    } catch (err) {
      console.error("Failed to decrypt LINE_CHANNEL_SECRET from DB:", err);
    }
  }
  return process.env.LINE_CHANNEL_SECRET || "";
}

export async function getLineAccessToken(): Promise<string> {
  const setting = await getSystemSettingRecord();
  if (setting?.lineAccessTokenEnc) {
    try {
      return decrypt(setting.lineAccessTokenEnc);
    } catch (err) {
      console.error("Failed to decrypt LINE_CHANNEL_ACCESS_TOKEN from DB:", err);
    }
  }
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
}
