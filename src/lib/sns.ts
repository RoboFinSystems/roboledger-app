import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'

interface SNSConfig {
  region: string
  contactTopicArn?: string
}

/**
 * SNS requires a subject to be single-line printable ASCII of at most 100
 * characters, and part of ours comes from the request body. Normalise it rather
 * than trusting it: an invalid subject makes Publish throw, which would drop
 * the notification altogether.
 */
function sanitizeSubject(raw: string): string {
  const cleaned = raw
    .replace(/[^ -~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.slice(0, 100) || 'New Contact Form Submission'
}

class SNSService {
  private client: SNSClient | null = null
  private config: SNSConfig

  constructor() {
    this.config = {
      region: process.env.AWS_REGION || 'us-east-1',
      contactTopicArn: process.env.SNS_CONTACT_TOPIC_ARN,
    }

    // Only initialize client if we have a topic ARN
    if (this.config.contactTopicArn) {
      this.client = new SNSClient({ region: this.config.region })
    }
  }

  async publishContactForm(data: {
    name: string
    email: string
    company?: string
    message: string
    formType: string
  }): Promise<boolean> {
    if (!this.client || !this.config.contactTopicArn) {
      console.warn('SNS not configured for contact form notifications')
      return false
    }

    try {
      const subject = sanitizeSubject(
        `New Contact Form Submission - ${data.formType}`
      )
      const message = `
New contact form submission received:

Type: ${data.formType}
Name: ${data.name}
Email: ${data.email}
Company: ${data.company || 'Not provided'}

Message:
${data.message}

---
Submitted at: ${new Date().toISOString()}
      `.trim()

      const command = new PublishCommand({
        TopicArn: this.config.contactTopicArn,
        Subject: subject,
        Message: message,
      })

      await this.client.send(command)
      return true
    } catch (error) {
      console.error('Failed to publish contact form to SNS:', error)
      return false
    }
  }
}

// Export singleton instance
export const snsService = new SNSService()
