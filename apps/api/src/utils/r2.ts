import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET || 'framedle-content'
const URL_EXPIRY_SECONDS = 3600 // 1 hour

/**
 * Generate a presigned URL for a frame image in R2.
 */
export async function getPresignedFrameUrl(r2Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: r2Key,
  })
  return getSignedUrl(s3, command, { expiresIn: URL_EXPIRY_SECONDS })
}

/**
 * Generate presigned URLs for multiple frame keys.
 */
export async function getPresignedFrameUrls(
  r2Keys: string[],
): Promise<string[]> {
  return Promise.all(r2Keys.map(getPresignedFrameUrl))
}
